/**
 * TypeWhale ASCII art — 4 animation frames.
 * Each frame is an array of 5 strings (5 rows).
 */
import type { SpeciesId } from '../../types.ts';

export const SPECIES_ID: SpeciesId = 'typewhale';

export const FRAMES: string[][] = [
  // Frame 0: idle
  [
    '  \u2570\u2550\u2550\u256e\u256d\u2550\u2550\u256f  ',
    ' \u27e8  O_O  \u27e9 ',
    '  \u00b7\u00b7 T \u00b7\u00b7   ',
    ' \u2591\u2550\u2550\u2550\u2550\u2550\u2550\u2591  ',
    '   \u2195  \u2195     ',
  ],
  // Frame 1: type spray
  [
    '  \u2570\u2550\u2550\u256e\u256d\u2550\u2550\u256f  ',
    ' \u27e8  -_-  \u27e9 ',
    '  ::T::  ',
    ' \u2591\u2550\u2550\u2550\u2550\u2550\u2550\u2591  ',
    '   \u2195  \u2195     ',
  ],
  // Frame 2: dive
  [
    '  \u2570\u2550\u2550  \u2550\u2550\u256f  ',
    ' \u27e8  O_O  \u27e9 ',
    '  ~ T ~   ',
    ' \u2591\u2550\u2550\u2550\u2550\u2550\u2550\u2591  ',
    '   \u2195\u2195\u2195     ',
  ],
  // Frame 3: splash
  [
    '  \u2570\u2550\u2550\u256e\u256d\u2550\u2550\u256f  ',
    ' \u27e8  ^_^  \u27e9 ',
    '  :T:T:   ',
    ' \u2591\u2550\u2550\u2550\u2550\u2550\u2550\u2591  ',
    '    \u2195  \u2195    ',
  ],
];
