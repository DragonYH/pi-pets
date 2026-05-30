import type { PetEngine } from '../pet_instance.ts';
import { getSpecies } from '../species.ts';

/**
 * Build the footer status line for the pet.
 * Expected to be called by the engine and set via ctx.ui.setStatus().
 */
export function buildFooterStatus(engine: PetEngine): string | undefined {
  if (!engine.hasPet || !engine.state) return undefined;

  const s = engine.state;
  const species = getSpecies(s.bones.species);
  const emoji = species?.emoji || '🐾';

  return `${emoji} "${s.name}" Lv.${s.level} ${engine.emotionEmoji} ⭐${s.xp}XP H:${s.needs.hunger} E:${s.needs.energy}`;
}
