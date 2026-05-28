/**
 * HexHound ASCII art — 4 animation frames.
 * Each frame is an array of 5 strings (5 rows).
 */
import type { SpeciesId } from '../../types.ts';

export const SPECIES_ID: SpeciesId = 'hexhound';

export const FRAMES: string[][] = [
  // Frame 0: idle
  [
    '  ^\\___/^  ',
    ' |  0x0  | ',
    '  \\  B  /  ',
    '   |   |   ',
    '  /     \\  ',
  ],
  // Frame 1: sniff
  [
    '  ^\\___/^  ',
    ' |  0x0  | ',
    '  \\  B  /  ',
    '   |   |   ',
    ' /       \\ ',
  ],
  // Frame 2: alert
  [
    '  ^\\___/^  ',
    ' |  0X0  | ',
    '  \\ !!  /  ',
    '   |   |   ',
    '  /     \\  ',
  ],
  // Frame 3: happy
  [
    '  ^\\___/^  ',
    ' |  8x8  | ',
    '  \\ ^^  /  ',
    '   |   |   ',
    '  /     \\  ',
  ],
];
