import type { PetBones, RarityTier, Stats } from './types.ts';
import { STAT_KEYS } from './types.ts';
import { createPrng } from './prng.ts';
import { CONFIG } from './config.ts';

/**
 * Determine rarity tier from a random roll [0, 100).
 */
function rollRarity(roll: number): RarityTier {
  const w = CONFIG.RARITY_WEIGHTS;
  // Cumulative thresholds: legendary=1, epic=5, rare=15, uncommon=40, common=100
  if (roll < w.legendary) return 'legendary';
  if (roll < w.legendary + w.epic) return 'epic';
  if (roll < w.legendary + w.epic + w.rare) return 'rare';
  if (roll < w.legendary + w.epic + w.rare + w.uncommon) return 'uncommon';
  return 'common';
}

/**
 * Hatch a pet skeleton deterministically from a seed number and species id.
 * speciesId is required — there are no built-in species.
 */
export function hatch(seed: number, speciesId: string): PetBones {
  const prng = createPrng(seed);

  // Rarity roll
  const rarity = rollRarity(prng.next() * 100);

  // Shiny roll
  const isShiny = prng.next() < CONFIG.SHINY_CHANCE;

  // Base stats: flat defaults + random offset 0-STAT_RANDOM_RANGE
  const baseStats: Stats = {
    debugging: 50 + prng.int(CONFIG.STAT_RANDOM_RANGE),
    patience: 50 + prng.int(CONFIG.STAT_RANDOM_RANGE),
    chaos: 50 + prng.int(CONFIG.STAT_RANDOM_RANGE),
    wisdom: 50 + prng.int(CONFIG.STAT_RANDOM_RANGE),
    snark: 50 + prng.int(CONFIG.STAT_RANDOM_RANGE),
  };
  for (const key of STAT_KEYS) {
    baseStats[key] = Math.min(100, baseStats[key]);
  }

  // Gender
  const gender = prng.next() < 0.5 ? 'male' : 'female';

  return {
    species: speciesId,
    rarity,
    isShiny,
    gender,
    baseStats,
  };
}

/**
 * Reconstruct bones from a saved seed (e.g. when loading state).
 */
export function reconstruct(seed: number, speciesId: string): PetBones {
  return hatch(seed, speciesId);
}
