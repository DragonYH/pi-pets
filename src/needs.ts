import type { Needs } from './types.js';
import type { EmotionState } from './types.js';
import { CONFIG } from './config.js';

/**
 * Tick needs decay based on elapsed time (in ms).
 * Mutates and returns the needs object.
 */
export function tickNeeds(needs: Needs, elapsedMs: number): Needs {
  const minutes = elapsedMs / 60_000;
  const rates = CONFIG.NEEDS_DECAY_RATES;

  needs.hunger = Math.max(0, Math.round(needs.hunger - rates.hunger * minutes));
  needs.energy = Math.max(0, Math.round(needs.energy - rates.energy * minutes));
  needs.happiness = Math.max(0, Math.round(needs.happiness - rates.happiness * minutes));

  return needs;
}

/**
 * Feed the pet — restores hunger.
 */
export function feed(needs: Needs): Needs {
  needs.hunger = Math.min(100, needs.hunger + CONFIG.NEEDS_RECOVERY.feed);
  return needs;
}

/**
 * Pet the pet — restores happiness.
 */
export function petPet(needs: Needs): Needs {
  needs.happiness = Math.min(100, needs.happiness + CONFIG.NEEDS_RECOVERY.pet);
  return needs;
}

/**
 * Idle recovery: restore 20% of all needs if pet has been offline for 30+ min.
 */
export function applyIdleRecovery(needs: Needs, elapsedMs: number): Needs {
  if (elapsedMs >= 30 * 60_000) {
    const recover = CONFIG.NEEDS_RECOVERY.idleRecovery;
    needs.hunger = Math.min(100, needs.hunger + recover);
    needs.energy = Math.min(100, needs.energy + recover);
    needs.happiness = Math.min(100, needs.happiness + recover);
  }
  return needs;
}

/**
 * Determine emotion from needs state.
 * Returns the emotion string without side effects.
 */
export function emotionFromNeeds(needs: Needs): EmotionState {
  const { hunger, energy, happiness } = needs;

  // Critical states take priority
  if (hunger < 10 || energy < 10 || happiness < 10) {
    return 'sick';
  }
  if (hunger < 30) {
    return 'hungry';
  }
  if (energy < 30) {
    return 'tired';
  }
  // Default: happy if needs are comfortable
  if (hunger > 60 && energy > 60 && happiness > 60) {
    return 'happy';
  }
  // Mid-range
  if (happiness < 50) {
    return 'frustrated';
  }
  // Curious: comfortable enough but not fully satisfied
  if (energy > 60 && hunger > 50) {
    return 'curious';
  }
  return 'happy';
}

/**
 * Resolve emotion combining needs and working state.
 * Sick always takes priority regardless of working state.
 * When working: extreme lows (<20) override working;
 * otherwise show working.
 * When not working: falls through to original emotionFromNeeds.
 */
export function resolveEmotion(needs: Needs, isRecentlyWorking: boolean): EmotionState {
  const { hunger, energy, happiness } = needs;

  // Critical states take priority regardless of working
  if (hunger < 10 || energy < 10 || happiness < 10) {
    return 'sick';
  }

  if (isRecentlyWorking) {
    // During work: extreme lows override working
    if (energy < 20) return 'tired';
    if (hunger < 20) return 'hungry';
    if (happiness < 20) return 'frustrated';
    return 'working';
  }

  // Not recently working: original emotion logic
  return emotionFromNeeds(needs);
}
