/**
 * Pyrofox ASCII art — 4 animation frames.
 * Each frame is an array of 5 strings (5 rows).
 */

import type { SpeciesId } from '../../types.ts';

export const SPECIES_ID: SpeciesId = 'pyrofox';

export const FRAMES: string[][] = [
  // Frame 0: idle blink
  [
    '  /\\___/\\  ',
    ' (  o o  ) ',
    ' (  =^=  ) ',
    '  (_____)  ',
    '  ~~~ ~~~  ',
  ],
  // Frame 1: eyes closed
  [
    '  /\\___/\\  ',
    ' (  - -  ) ',
    ' (  =^=  ) ',
    '  (_____)  ',
    '  ~~~ ~~~  ',
  ],
  // Frame 2: curious tilt
  [
    '  /\\___/\\  ',
    ' (  o o  ) ',
    ' (  =^=  ) ',
    '  (_____)  ',
    '  ~ ~~  ~  ',
  ],
  // Frame 3: happy squint
  [
    '  /\\___/\\  ',
    ' (  ^ ^  ) ',
    ' (  =^=  ) ',
    '  (_____)  ',
    '  ~~~ ~~~  ',
  ],
];
