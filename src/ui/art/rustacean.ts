/**
 * Rustacean ASCII art — 4 animation frames.
 * Each frame is an array of 5 strings (5 rows).
 */

import type { SpeciesId } from '../../types.ts';

export const SPECIES_ID: SpeciesId = 'rustacean';

export const FRAMES: string[][] = [
  // Frame 0: idle
  [
    '   .--.    ',
    '  / o_o\\   ',
    '  |  V  |  ',
    '  \\=====/  ',
    '   \\===/   ',
  ],
  // Frame 1: claw clench
  [
    '   .--.    ',
    '  / -_-\\   ',
    '  |  V  |  ',
    '  /=====\\  ',
    '   \\===/   ',
  ],
  // Frame 2: curious
  [
    '   .--.    ',
    '  / O_O\\   ',
    '  |  V  |  ',
    '  \\=====/  ',
    '   /===\\   ',
  ],
  // Frame 3: happy
  [
    '   .--.    ',
    '  / ^_^\\   ',
    '  |  V  |  ',
    '  \\=====/  ',
    '   \\===/   ',
  ],
];
