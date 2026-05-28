/**
 * Gopher ASCII art — 4 animation frames.
 * Each frame is an array of 5 strings (5 rows).
 */
import type { SpeciesId } from '../../types.ts';

export const SPECIES_ID: SpeciesId = 'gopher';

export const FRAMES: string[][] = [
  // Frame 0: idle
  [
    '  ,___,  ',
    ' / o_o \\ ',
    '|   \u2699   | ',
    ' \\___  / ',
    '  /||\\   ',
  ],
  // Frame 1: blink
  [
    '  ,___,  ',
    ' / -_- \\ ',
    '|   \u2699   | ',
    ' \\___  / ',
    '  /||\\   ',
  ],
  // Frame 2: curious tilt
  [
    '  ,___,  ',
    ' / O_O \\ ',
    '|   \u2699   | ',
    ' \\_  __/ ',
    '  /||\\   ',
  ],
  // Frame 3: happy
  [
    '  ,___,  ',
    ' / ^_^ \\ ',
    '|  \u2699\u2699  | ',
    ' \\___  / ',
    '  /||\\   ',
  ],
];
