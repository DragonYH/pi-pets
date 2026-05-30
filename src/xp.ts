import { CONFIG } from './config.js';

/**
 * Calculate level from total XP.
 * Level = floor(sqrt(xp / BASE))
 */
export function getLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / CONFIG.LEVEL_CURVE_BASE)));
}

/**
 * XP needed to reach a given level.
 */
export function xpForLevel(level: number): number {
  return level * level * CONFIG.LEVEL_CURVE_BASE;
}

/**
 * Roll XP reward within a range.
 */
export function rollXp(min: number, max: number, prng?: { next(): number }): number {
  const r = prng ? prng.next() : Math.random();
  return min + Math.floor(r * (max - min + 1));
}

/**
 * Calculate XP from a turn completion event.
 */
export function xpFromTurnComplete(prng?: { next(): number }): number {
  const r = CONFIG.XP_REWARDS.turnComplete;
  return rollXp(r.min, r.max, prng);
}

/**
 * Calculate XP from a successful tool execution.
 */
export function xpFromToolSuccess(prng?: { next(): number }): number {
  const r = CONFIG.XP_REWARDS.toolSuccess;
  return rollXp(r.min, r.max, prng);
}

/**
 * Calculate XP from all tests passing in one run.
 */
export function xpFromTestsAllPass(): number {
  return CONFIG.XP_REWARDS.testsAllPass;
}

/**
 * Calculate XP from fixing an error.
 */
export function xpFromErrorFixed(): number {
  return CONFIG.XP_REWARDS.errorFixed;
}

/**
 * Calculate XP from using a pet command.
 */
export function xpFromPetCommand(): number {
  return CONFIG.XP_REWARDS.petCommand;
}

export function xpFromFeedCommand(): number {
  return CONFIG.XP_REWARDS.feedCommand;
}
