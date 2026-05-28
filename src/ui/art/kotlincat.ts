/**
 * Kotlincat ASCII art — 4 animation frames.
 * Each frame is an array of 5 strings (5 rows).
 */
import type { SpeciesId } from '../../types.ts';

export const SPECIES_ID: SpeciesId = 'kotlincat';

export const FRAMES: string[][] = [
  // Frame 0: idle
  [
    '  /\\___/\\  ',
    ' (  o o  ) ',
    ' (  :?:  ) ',
    '  (___)?~  ',
    '   ~~      ',
  ],
  // Frame 1: blink
  [
    '  /\\___/\\  ',
    ' (  - -  ) ',
    ' (  :?:  ) ',
    '  (___)?~  ',
    '   ~~      ',
  ],
  // Frame 2: curious
  [
    '  /\\___/\\  ',
    ' (  O O  ) ',
    ' (  :?:  ) ',
    '  (___)?~  ',
    '   ~~      ',
  ],
  // Frame 3: happy
  [
    '  /\\___/\\  ',
    ' (  ^ ^  ) ',
    ' (  :!:  ) ',
    '  (___)?~  ',
    '   ~~      ',
  ],
];
