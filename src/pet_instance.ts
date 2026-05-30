import { randomUUID } from 'node:crypto';
import type { PetBones, PetState, GrowthStage, EmotionState, Needs } from './types.ts';
import { CONFIG } from './config.ts';
import { hatch } from './hatchery.ts';
import { generateFallbackName } from './name_generator.ts';
import { getLevel, xpFromTurnComplete, xpFromToolSuccess, xpFromTestsAllPass, xpFromErrorFixed } from './xp.ts';
import { mulberry32 } from './prng.ts';
import { getStage, stageDisplayName, isStageTransition } from './evolution.ts';
import { tickNeeds, feed, petPet, applyIdleRecovery, resolveEmotion } from './needs.ts';
import { Persistence } from './persistence.ts';

/**
 * PetEngine - the main controller for pets.
 * Manages state transitions, XP, needs, and multi-pet persistence.
 * One active pet at a time, but multiple independent pet states on disk.
 */
export class PetEngine {
  state: PetState | null = null;
  private persistence: Persistence;
  private currentErrorCount = 0;
  private currentTestsPassed = 0;

  private xpRng: { next(): number };

  /** Shared render state (set by events/commands, consumed by render loop). */
  currentBubble: string = '';
  animationFrame: number = 0;

  /** Timestamp of most recent user activity (tool exec / turn end). */
  private lastActivityTimestamp: number = Date.now();

  /** Timestamp until which event-set emotions (frustrated/excited) are held. */
  private emotionHoldUntil: number = 0;

  constructor(baseDir?: string) {
    this.persistence = new Persistence(baseDir);
    this.xpRng = mulberry32(Date.now());
  }

  /** Record recent activity for working-state detection. */
  private recordActivity(): void {
    this.lastActivityTimestamp = Date.now();
  }

  /** Check if there was recent activity within the working window. */
  private isRecentlyWorking(): boolean {
    return Date.now() - this.lastActivityTimestamp < CONFIG.WORKING_WINDOW_MS;
  }

  get hasPet(): boolean {
    return this.state !== null;
  }

  get petName(): string {
    return this.state?.name ?? '无';
  }

  /** Reinitialize PRNG from pet seed (ensures deterministic XP rolls). */
  private initXpRng(): void {
    if (this.state) {
      this.xpRng = mulberry32(this.state.seed ^ 0xdeadbeef);
    }
  }

  /** Set the pet's speech bubble text. */
  setBubble(text: string): void {
    this.currentBubble = text;
  }

  // ===== Lifecycle =====

  /** Load the active pet from persistence (by active pointer). */
  async load(): Promise<boolean> {
    const activeId = await this.persistence.getActivePetId();
    if (!activeId) return false;

    const loaded = await this.persistence.loadPet(activeId);
    if (loaded) {
      this.state = loaded;
      // Apply idle recovery for time spent away
      this.initXpRng();
      const elapsed = Date.now() - this.state.lastTickTimestamp;
      if (elapsed > 60_000) {
        applyIdleRecovery(this.state.needs, elapsed);
        tickNeeds(this.state.needs, elapsed);
      }
      this.state.lastTickTimestamp = Date.now();
      this.recordActivity();
      return true;
    }
    return false;
  }

  /** Save current state to its independent pet file. */
  async save(): Promise<void> {
    if (!this.state) return;
    this.state.lastTickTimestamp = Date.now();
    await this.persistence.savePet(this.state);
  }

  /** Hatch a new pet from a seed, save as independent file, set as active. */
  async hatch(seed: number, speciesOverride: string): Promise<{ name: string; stage: GrowthStage }> {
    const bones = hatch(seed, speciesOverride);
    const naming = generateFallbackName(bones, seed);

    this.state = {
      version: CONFIG.STATE_VERSION,
      id: randomUUID(),
      seed,
      bones,
      name: naming.name,
      personality: naming.personality,
      level: 1,
      xp: 0,
      stage: 'baby',
      emotion: 'happy',
      needs: { hunger: 100, energy: 100, happiness: 100 },
      lastTickTimestamp: Date.now(),
      totalSessions: 0,
      totalErrors: 0,
      totalTestsPassed: 0,
      createdAt: Date.now(),
      unlockedSkills: [],
      equippedSkills: [],
    };
    this.initXpRng();
    this.recordActivity();
    await this.persistence.savePet(this.state);
    await this.persistence.setActivePetId(this.state.id);
    return { name: this.state.name, stage: this.state.stage };
  }

  /** Release the current pet (delete its file and clear active pointer). */
  async release(): Promise<void> {
    if (this.state) {
      await this.persistence.deletePet(this.state.id);
    }
    this.state = null;
    await this.persistence.setActivePetId(null);
  }

  /** Check if a pet already exists for the given species. */
  async getExistingPetForSpecies(speciesId: string): Promise<PetState | null> {
    const allIds = await this.persistence.listPetIds();
    for (const id of allIds) {
      const pet = await this.persistence.loadPet(id);
      if (pet && pet.bones.species === speciesId) {
        return pet;
      }
    }
    return null;

  /** List all pet states (for /pets list). */
  async listAllPets(): Promise<PetState[]> {
    const ids = await this.persistence.listPetIds();
    const pets: PetState[] = [];
    for (const id of ids) {
      const pet = await this.persistence.loadPet(id);
      if (pet) pets.push(pet);
    }
    return pets;
  }
  }

  /** Switch to an existing pet by loading its state and updating the active pointer. */
  async switchToPet(petState: PetState): Promise<void> {
    // Save current pet if any
    if (this.state) {
      await this.persistence.savePet(this.state);
    }
    this.state = petState;
    this.initXpRng();
    // Apply idle recovery for time spent away (same as load())
    const elapsed = Date.now() - this.state.lastTickTimestamp;
    if (elapsed > 60_000) {
      applyIdleRecovery(this.state.needs, elapsed);
      tickNeeds(this.state.needs, elapsed);
    }
    this.state.lastTickTimestamp = Date.now();
    this.recordActivity();
    await this.persistence.setActivePetId(this.state.id);
  }

  // ===== Needs & Emotion =====

  /** Periodic tick — decays needs and re-evaluates emotion. */
  tick(): EmotionState | null {
    if (!this.state) return null;
    const now = Date.now();
    const elapsed = now - this.state.lastTickTimestamp;
    if (elapsed < 10_000) return null; // avoid rapid ticks

    tickNeeds(this.state.needs, elapsed);
    this.state.lastTickTimestamp = now;

    // Skip emotion re-evaluation if a hold is active (event-set emotion like frustrated/excited)
    if (Date.now() < this.emotionHoldUntil) return null;

    const newEmotion = resolveEmotion(this.state.needs, this.isRecentlyWorking());
    const changed = newEmotion !== this.state.emotion;
    this.state.emotion = newEmotion;
    return changed ? newEmotion : null;
  }

  /** Feed the pet. */
  doFeed(): boolean {
    if (!this.state) return false;
    feed(this.state.needs);
    this.state.emotion = resolveEmotion(this.state.needs, this.isRecentlyWorking());
    return true;
  }

  /** Pet the pet. */
  doPet(): boolean {
    if (!this.state) return false;
    petPet(this.state.needs);
    this.state.emotion = resolveEmotion(this.state.needs, this.isRecentlyWorking());
    return true;
  }

  // ===== XP & Growth =====

  /** Add XP and check for level/stage transitions. */
  addXp(amount: number): { leveledUp: boolean; newStage: GrowthStage | null } {
    if (!this.state) return { leveledUp: false, newStage: null };

    const oldLevel = this.state.level;
    this.state.xp += amount;
    const newLevel = getLevel(this.state.xp);
    this.state.level = newLevel;
    this.state.stage = getStage(newLevel);

    const leveledUp = newLevel > oldLevel;
    const transition = isStageTransition(oldLevel, newLevel);

    return { leveledUp, newStage: transition };
  }

  /** Called after each turn completes. */
  onTurnComplete(): { xpGained: number; leveledUp: boolean; newStage: GrowthStage | null } {
    const amount = xpFromTurnComplete(this.xpRng);
    this.recordActivity();
    const result = this.addXp(amount);
    return { xpGained: amount, ...result };
  }

  /** Called after a tool execution completes. */
  onToolExecuted(success: boolean, isError: boolean): void {
    if (!this.state) return;

    this.recordActivity();

    if (success && !isError) {
      this.addXp(xpFromToolSuccess(this.xpRng));
    }

    // Track errors for emotion
    if (isError) {
      this.state.totalErrors++;
      this.currentErrorCount++;
      this.addXp(xpFromErrorFixed());

      // Override emotion for frustration
      if (this.currentErrorCount >= 3) {
        this.state.emotion = 'frustrated';
        this.emotionHoldUntil = Date.now() + CONFIG.EMOTION_HOLD_MS;
      }
    } else {
      this.currentErrorCount = 0;
    }
  }

  /** Called when tests pass. */
  onTestsPassed(count: number): void {
    if (!this.state) return;
    this.state.totalTestsPassed += count;
    this.addXp(xpFromTestsAllPass());
    this.recordActivity();
    this.state.emotion = 'excited';
    this.emotionHoldUntil = Date.now() + CONFIG.EMOTION_HOLD_MS;
  }

  /** Called when a session starts. */
  onSessionStart(): void {
    if (!this.state) return;
    this.state.totalSessions++;
  }

  // ===== UI helpers =====

  get emotionEmoji(): string {
    if (!this.state) return '';
    const map: Record<EmotionState, string> = {
      happy: '\u{1F60A}',
      curious: '\u{1F914}',
      excited: '\u{1F389}',
      tired: '\u{1F634}',
      hungry: '\u{1F37D}\uFE0F',
      frustrated: '\u{1F624}',
      sick: '\u{1F912}',
      working: '\u{1F4BB}',
    };
    return map[this.state.emotion];
  }

  get statusLine(): string {
    if (!this.state) return '';
    const s = this.state;
    return `"${s.name}" Lv.${s.level} ${this.emotionEmoji} \u2B50${s.xp}XP H:${s.needs.hunger} E:${s.needs.energy}`;
  }

  get stageName(): string {
    if (!this.state) return '';
    return stageDisplayName(this.state.stage);
  }

  get rarityLabel(): string {
    if (!this.state) return '';
    const map: Record<string, string> = {
      common: '\u666E\u901A',
      uncommon: '\u7A00\u6709',
      rare: '\u7CBE\u826F',
      epic: '\u53F2\u8BD7',
      legendary: '\u4F20\u8BF4',
    };
    return map[this.state.bones.rarity] ?? this.state.bones.rarity;
  }
}
