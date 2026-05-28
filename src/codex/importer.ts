import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { convertSpritesheet, type ConversionResult } from './converter.ts';
import { renderAnsiFrames } from './renderer.ts';
import { renderAsciiFrames } from './ascii-fallback.ts';
import { saveCache } from './cache.ts';
import type { CodexCacheEntry, CodexAnimationState } from '../types.ts';

const CODEX_CACHE_VERSION = 1;

/**
 * Result of importing a Codex pet.
 */
export interface ImportResult {
  speciesId: string;
  displayName: string;
  emoji: string;
}

/**
 * Validated metadata from pet.json.
 */
interface PetJsonMeta {
  name: string;
  species?: string;
  emoji?: string;
  id?: string;
  displayName?: string;
}

/**
 * Import a Codex pet from a directory containing pet.json + spritesheet.webp.
 *
 * The function:
 * 1. Reads and validates pet.json
 * 2. Converts the spritesheet to pixel grids
 * 3. Generates ANSI and ASCII fallback caches
 * 4. Saves the cache to ~/.pi/pets/codex-cache/{speciesId}.json
 *
 * @param petDir - Path to the directory containing pet.json and spritesheet.webp
 * @returns Import result with speciesId and displayName
 */
export async function importCodexPet(petDir: string): Promise<ImportResult> {
  const jsonPath = join(petDir, 'pet.json');
  const webpPath = join(petDir, 'spritesheet.webp');

  // Read and validate pet.json
  let petMeta: PetJsonMeta;
  try {
    const raw = await readFile(jsonPath, 'utf-8');
    petMeta = JSON.parse(raw) as PetJsonMeta;
  } catch (err) {
    throw new Error(`Failed to read pet.json: ${(err as Error).message}`);
  }

  if (!petMeta.name && !petMeta.displayName) {
    throw new Error('pet.json must contain a "name" or "displayName" field');
  }

  const displayName = petMeta.displayName ?? petMeta.name!;
  const speciesId = petMeta.species ?? petMeta.id ?? displayName.toLowerCase().replace(/\s+/g, '_');
  const emoji = petMeta.emoji ?? '🐾';

  // Convert spritesheet
  const conversion: ConversionResult = await convertSpritesheet(webpPath);

  // Generate render caches for all states
  const frames: Record<string, string[][]> = {};
  const asciiFallback: Record<string, string[][]> = {};

  const stateKeys: CodexAnimationState[] = [
    'idle', 'run', 'sleep', 'eat', 'attack', 'hurt', 'jump', 'play', 'failed',
  ];

  for (const state of stateKeys) {
    const pixelFrames = conversion[state];
    if (pixelFrames && pixelFrames.length > 0) {
      frames[state] = renderAnsiFrames(pixelFrames);
      asciiFallback[state] = renderAsciiFrames(pixelFrames);
    }
  }

  // Build cache entry
  const entry: CodexCacheEntry = {
    version: CODEX_CACHE_VERSION,
    speciesId,
    meta: {
      displayName,
      emoji,
    },
    frames,
    asciiFallback,
  };

  // Persist cache
  await saveCache(speciesId, entry);

  return { speciesId, displayName, emoji };
}
