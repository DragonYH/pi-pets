/**
 * BashBat ASCII art — 4 animation frames.
 * Each frame is an array of 5 strings (5 rows).
 */
import type { SpeciesId } from '../../types.ts';

export const SPECIES_ID: SpeciesId = 'bashbat';

export const FRAMES: string[][] = [
  // Frame 0: idle hang
  [
    '   /\\___/\\   ',
    '  (  o.o  )  ',
    '   V   V     ',
    '  /||||||\\   ',
    ' /  ||||  \\  ',
  ],
  // Frame 1: blink
  [
    '   /\\___/\\   ',
    '  (  -. -  )  ',
    '   V   V     ',
    '  /||||||\\   ',
    ' /  ||||  \\  ',
  ],
  // Frame 2: watchful
  [
    '   /\\___/\\   ',
    '  (  O.O  )  ',
    '   V   V     ',
    '  /||||||\\   ',
    ' /  ||||  \\  ',
  ],
  // Frame 3: happy
  [
    '   /\\___/\\   ',
    '  (  ^.^  )  ',
    '   V   V     ',
    '  /\\||||/\\   ',
    ' /  ||||  \\  ',
  ],
];
