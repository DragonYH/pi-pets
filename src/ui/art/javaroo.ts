/**
 * Javaroo ASCII art — 4 animation frames.
 * Each frame is an array of 5 strings (5 rows).
 */
import type { SpeciesId } from '../../types.ts';

export const SPECIES_ID: SpeciesId = 'javaroo';

export const FRAMES: string[][] = [
  // Frame 0: idle
  [
    '  ,___,  ',
    ' / o_o \\ ',
    ' | C[] | ',
    ' \\__[__\\ ',
    '   ||~   ',
  ],
  // Frame 1: blink
  [
    '  ,___,  ',
    ' / -_- \\ ',
    ' | C[] | ',
    ' \\__[__\\ ',
    '   ||~   ',
  ],
  // Frame 2: curious
  [
    '  ,___,  ',
    ' / O_O \\ ',
    ' | C[] | ',
    ' \\_ [__\\ ',
    '   ||~   ',
  ],
  // Frame 3: happy
  [
    '  ,___,  ',
    ' / ^_^ \\ ',
    ' | C[] | ',
    ' \\__[__\\ ',
    '   ||~   ',
  ],
];
