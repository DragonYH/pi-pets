/**
 * Pythonidae ASCII art — 4 animation frames.
 * Each frame is an array of 5 strings (5 rows).
 */

import type { SpeciesId } from '../../types.ts';

export const SPECIES_ID: SpeciesId = 'pythonidae';

export const FRAMES: string[][] = [
  // Frame 0: idle
  [
    '   __    ',
    '  /  \\   ',
    ' | o_o|  ',
    '  \\__/   ',
    '  /||\\   ',
  ],
  // Frame 1: tongue flick
  [
    '   __    ',
    '  /  \\   ',
    ' | -_-|  ',
    '  \\__/   ',
    '  /||\\   ',
  ],
  // Frame 2: slither
  [
    '   ~     ',
    '  /  \\   ',
    ' | o_o|  ',
    '  \\_\\/   ',
    '   /||\\  ',
  ],
  // Frame 3: watchful
  [
    '   __    ',
    '  /  \\   ',
    ' | O_O|  ',
    '  \\__/   ',
    '  //\\\\   ',
  ],
];
