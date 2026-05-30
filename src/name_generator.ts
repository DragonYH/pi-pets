import type { PetBones } from './types.js';

/**
 * Generate a fallback name: default = species name/id.
 * No built-in name presets — all species are imported.
 */
export function generateFallbackName(bones: PetBones, _seed: number): { name: string; personality: string } {
  return { name: bones.species, personality: 'A mysterious imported pet' };
}
