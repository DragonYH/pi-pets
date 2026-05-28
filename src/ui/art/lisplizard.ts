/**
 * LispLizard ASCII art — 4 animation frames.
 * Each frame is an array of 5 strings (5 rows).
 */
import type { SpeciesId } from '../../types.ts';

export const SPECIES_ID: SpeciesId = 'lisplizard';

export const FRAMES: string[][] = [
  // Frame 0: idle
  [
    '  .___.  ',
    ' / o_o \\ ',
    '  \\ : /  ',
    '  /|||\\  ',
    ' (     ) ',
  ],
  // Frame 1: blink
  [
    '  .___.  ',
    ' / -_- \\ ',
    '  \\ : /  ',
    '  /|||\\  ',
    ' (     ) ',
  ],
  // Frame 2: tongue flick
  [
    '  .___.  ',
    ' / O_O \\ ',
    '  \\ >/   ',
    '  /|||\\  ',
    ' (     ) ',
  ],
  // Frame 3: happy
  [
    '  .___.  ',
    ' / ^_^ \\ ',
    '  \\ : /  ',
    '  /|||\\  ',
    ' )     ( ',
  ],
];
