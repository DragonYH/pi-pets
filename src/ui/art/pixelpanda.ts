/**
 * PixelPanda ASCII art — 4 animation frames.
 * Each frame is an array of 5 strings (5 rows).
 */
import type { SpeciesId } from '../../types.ts';

export const SPECIES_ID: SpeciesId = 'pixelpanda';

export const FRAMES: string[][] = [
  // Frame 0: idle
  [
    '  .___.  ',
    ' / o_o \\ ',
    '|  \u2592\u2592\u2592  | ',
    '  \\___/  ',
    '  /|||\\  ',
  ],
  // Frame 1: blink
  [
    '  .___.  ',
    ' / -_- \\ ',
    '|  \u2592\u2592\u2592  | ',
    '  \\___/  ',
    '  /|||\\  ',
  ],
  // Frame 2: curious
  [
    '  .___.  ',
    ' / O_O \\ ',
    '|  \u2592\u2592\u2592  | ',
    '  \\___/  ',
    '  /|||\\  ',
  ],
  // Frame 3: happy
  [
    '  .___.  ',
    ' / ^_^ \\ ',
    '|  \u2592\u2593\u2592  | ',
    '  \\___/  ',
    '  /|||\\  ',
  ],
];
