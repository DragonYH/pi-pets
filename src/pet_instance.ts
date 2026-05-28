import { randomUUID } from 'node:crypto';
import type { PetBones, PetState, GrowthStage, EmotionState, Needs } from './types.ts';
import { CONFIG } from './config.ts';
import { hatch } from './hatchery.ts';
import { generateFallbackName } from './name_generator.ts';
import { getLevel, xpFromTurnComplete, xpFromToolSuccess, xpFromTestsAllPass, xpFromErrorFixed } from './xp.ts';
import { getStage, stageDisplayName, isStageTransition } from './evolution.ts';
import { tickNeeds, feed, petPet, applyIdleRecovery, emotionFromNeeds } from './needs.ts';
import { Persistence } from './persistence.ts';

/**
 * PetEngine - the main controller for a single pet.
 * Manages state transitions, XP, needs, and persistence.
 */
export class PetEngine {
  state: PetState | null = null;
  private persistence: Persistence;
  private currentErrorCount = 0;
  private currentTestsPassed = 0;

  constructor(baseDir?: string) {
    this.persistence = new Persistence(baseDir);
  }

  get hasPet(): boolean {
    return this.state !== null;
  }

  get petName(): string {
    return this.state?.name ?? '无';
  }

  // ===== Lifecycle =====

  /** Load an existing pet from persistence. */
  async load(): Promise<boolean> {
    const loaded = await this.persistence.load();
    if (loaded) {
      this.state = loaded;
      // Apply idle recovery for time spent away
      const elapsed = Date.now() - this.state.lastTickTimestamp;
      if (elapsed > 60_000) {
        applyIdleRecovery(this.state.needs, elapsed);
        tickNeeds(this.state.needs, elapsed);
      }
      this.state.lastTickTimestamp = Date.now();
      return true;
    }
    return false;
  }

  /** Save current state to persistence. */
  async save(): Promise<void> {
    if (!this.state) return;
    this.state.lastTickTimestamp = Date.now();
    await this.persistence.save(this.state);
  }

  /** Hatch a new pet from a seed. */
  async hatch(seed: number): Promise<{ name: string; stage: GrowthStage }> {
    const bones = hatch(seed);
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
    await this.save();
    return { name: this.state.name, stage: this.state.stage };
  }

  /** Release the pet (remove persistence). */
  async release(): Promise<void> {
    this.state = null;
    await this.persistence.delete();
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

    const newEmotion = emotionFromNeeds(this.state.needs);
    const changed = newEmotion !== this.state.emotion;
    this.state.emotion = newEmotion;
    return changed ? newEmotion : null;
  }

  /** Feed the pet. */
  doFeed(): boolean {
    if (!this.state) return false;
    feed(this.state.needs);
    this.state.emotion = emotionFromNeeds(this.state.needs);
    return true;
  }

  /** Pet the pet. */
  doPet(): boolean {
    if (!this.state) return false;
    petPet(this.state.needs);
    this.state.emotion = emotionFromNeeds(this.state.needs);
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
    const amount = xpFromTurnComplete();
    const result = this.addXp(amount);
    return { xpGained: amount, ...result };
  }

  /** Called after a tool execution completes. */
  onToolExecuted(success: boolean, isError: boolean): void {
    if (!this.state) return;

    if (success && !isError) {
      this.addXp(xpFromToolSuccess());
    }

    // Track errors for emotion
    if (isError) {
      this.state.totalErrors++;
      this.currentErrorCount++;
      this.addXp(xpFromErrorFixed());

      // Override emotion for frustration
      if (this.currentErrorCount >= 3) {
        this.state.emotion = 'frustrated';
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
    this.state.emotion = 'excited';
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
      happy: '😊',
      curious: '🤔',
      excited: '🎉',
      tired: '😴',
      hungry: '🍽️',
      frustrated: '😤',
      sick: '🤒',
    };
    return map[this.state.emotion];
  }

  get statusLine(): string {
    if (!this.state) return '';
    const s = this.state;
    return `"${s.name}" Lv.${s.level} ${this.emotionEmoji} ⭐${s.xp}XP H:${s.needs.hunger} E:${s.needs.energy}`;
  }

  get stageName(): string {
    if (!this.state) return '';
    return stageDisplayName(this.state.stage);
  }

  get rarityLabel(): string {
    if (!this.state) return '';
    const map: Record<string, string> = {
      common: '普通',
      uncommon: '稀有',
      rare: '精良',
      epic: '史诗',
      legendary: '传说',
    };
    return map[this.state.bones.rarity] ?? this.state.bones.rarity;
  }
}
