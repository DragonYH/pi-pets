import type { SpeciesDef } from './types.ts';

/**
 * No built-in species — all species come from `~/.pi/agent/pets/`.
 * `getSpecies()` returns a fallback definition for any id.
 */

export function getSpecies(id: string): SpeciesDef {
  return {
    id,
    name: id,
    nameEn: id,
    emoji: '\u{1F43E}',
    domain: 'imported',
    baseStats: { debugging: 50, patience: 50, chaos: 50, wisdom: 50, snark: 50 },
    description: 'Imported pet',
  };
}
