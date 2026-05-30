// ===== Species & Rarity =====

export type SpeciesId = string;

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type GrowthStage = 'baby' | 'child' | 'teen' | 'adult' | 'elder';

export type EmotionState =
  | 'happy'
  | 'curious'
  | 'excited'
  | 'tired'
  | 'hungry'
  | 'frustrated'
  | 'working'
  | 'sick';

export type Gender = 'male' | 'female';

// ===== Stats =====

export interface Stats {
  debugging: number;
  patience: number;
  chaos: number;
  wisdom: number;
  snark: number;
}

export const STAT_KEYS: (keyof Stats)[] = [
  'debugging',
  'patience',
  'chaos',
  'wisdom',
  'snark',
];

// ===== Pet Bone Structure (deterministic from seed) =====

export interface PetBones {
  species: SpeciesId;
  rarity: RarityTier;
  isShiny: boolean;
  gender: Gender;
  baseStats: Stats;
}

// ===== Species Definition =====

export interface SpeciesDef {
  id: SpeciesId;
  name: string;
  nameEn: string;
  emoji: string;
  domain: string;
  baseStats: Stats;
  description: string;
}

// ===== Needs =====

export interface Needs {
  hunger: number;
  energy: number;
  happiness: number;
}

// ===== Full Pet State =====

export interface PetState {
  version: 1;
  id: string;
  seed: number;
  bones: PetBones;
  name: string;
  personality: string;
  level: number;
  xp: number;
  stage: GrowthStage;
  emotion: EmotionState;
  needs: Needs;
  lastTickTimestamp: number;
  totalSessions: number;
  totalErrors: number;
  totalTestsPassed: number;
  createdAt: number;
  unlockedSkills: string[];
  equippedSkills: string[];
}

// ===== Event data for growth/emotion triggers =====

export interface AgentEventData {
  toolName?: string;
  success?: boolean;
  isError?: boolean;
  errorCount?: number;
  testsPassed?: number;
  testsFailed?: number;
}

// ===== UI Widget Data =====

export interface WidgetData {
  lines: string[];
  animationFrame: number;
}

// ===== Animation =====

export type AnimationState =
  | 'idle'
  | 'run'
  | 'sleep'
  | 'eat'
  | 'attack'
  | 'hurt'
  | 'jump'
  | 'play'
  | 'failed';

/**
 * Cached rendering of a pet's frames.
 * frames & textFallback: keyed by AnimationState, value is frame[][line][]
 */
export interface CacheEntry {
  version: number;
  speciesId: string;
  meta: {
    displayName: string;
    emoji: string;
  };
  frames: Record<string, string[][]>;
  textFallback: Record<string, string[][]>;
}