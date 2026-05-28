import type { PetBones, RarityTier, SpeciesDef, Stats } from './types.ts';
import { STAT_KEYS } from './types.ts';
import { createPrng } from './prng.ts';
import { SPECIES } from './species.ts';
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
 * Hatch a pet skeleton deterministically from a seed number.
 * Seed comes from hashing the user's pi config.
 */
export function hatch(seed: number, speciesOverride?: string): PetBones {
  const prng = createPrng(seed);

  // 1. Pick species
  let speciesDef: SpeciesDef;
  if (speciesOverride) {
    const found = SPECIES.find((s) => s.id === speciesOverride);
    if (found) {
      speciesDef = found;
    } else {
      // Imported Codex pet — create a default species definition
      speciesDef = {
        id: speciesOverride as SpeciesId,
        name: speciesOverride,
        nameEn: speciesOverride,
        emoji: '🐾',
        description: 'Imported Codex pet',
        domain: 'codex',
        baseStats: { debugging: 50, patience: 50, chaos: 50, wisdom: 50, snark: 50 },
      };
    }
  } else {
    speciesDef = prng.pick(SPECIES);
  }

  // 2. Rarity roll
  const rarity = rollRarity(prng.next() * 100);

  // 3. Shiny roll
  const isShiny = prng.next() < CONFIG.SHINY_CHANCE;

  // 4. Base stats: start from species base, add random offset 0-STAT_RANDOM_RANGE
  const baseStats: Stats = { ...speciesDef.baseStats };
  for (const key of STAT_KEYS) {
    baseStats[key] = Math.min(100, baseStats[key] + prng.int(CONFIG.STAT_RANDOM_RANGE));
  }

  // 5. Gender
  const gender = prng.next() < 0.5 ? 'male' : 'female';

  return {
    species: speciesDef.id,
    rarity,
    isShiny,
    gender,
    baseStats,
  };
}

/**
 * Reconstruct bones from a saved seed (e.g. when loading state).
 */
export function reconstruct(seed: number): PetBones {
  return hatch(seed);
}
