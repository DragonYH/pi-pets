import { readFile, writeFile, mkdir, unlink, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { CONFIG } from '../config.js';
import type { CacheEntry } from '../types.js';

export const CACHE_VERSION = 3;

/**
 * Get the absolute path to the pet cache directory.
 */
function cacheDir(): string {
  return join(homedir(), CONFIG.PET_CACHE_DIR);
}

/**
 * Full path to a cached species file.
 */
function cachePath(speciesId: string): string {
  return join(cacheDir(), `${speciesId}.json`);
}

/**
 * Ensure the cache directory exists.
 */
async function ensureCacheDir(): Promise<void> {
  const dir = cacheDir();
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // Directory already exists
  }
}

/**
 * Load a cached CacheEntry for the given species.
 * Returns null if cache does not exist or is unreadable.
 */
export async function loadCache(speciesId: string): Promise<CacheEntry | null> {
  const path = cachePath(speciesId);
  try {
    const raw = await readFile(path, 'utf-8');
    const parsed = JSON.parse(raw) as CacheEntry;
    // Version + basic validation
    if (parsed && parsed.speciesId === speciesId && parsed.version === CACHE_VERSION && parsed.frames) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save a CacheEntry.
 */
export async function saveCache(speciesId: string, entry: CacheEntry): Promise<void> {
  await ensureCacheDir();
  const path = cachePath(speciesId);
  // Atomic write: write to tmp then rename
  const tmpPath = path + '.tmp';
  await writeFile(tmpPath, JSON.stringify(entry, null, 2), 'utf-8');
  const { rename } = await import('node:fs/promises');
  await rename(tmpPath, path);
}

/**
 * Check if a cache entry exists.
 */
export function hasCache(speciesId: string): boolean {
  return existsSync(cachePath(speciesId));
}

/**
 * Delete a cache entry.
 */
export async function invalidateCache(speciesId: string): Promise<void> {
  const path = cachePath(speciesId);
  try {
    await unlink(path);
  } catch {
    // File may not exist
  }
}
/**
 * List all cached pet species in the cache directory.
 * Returns an empty array if the directory doesn't exist or contains no valid entries.
 */
export async function listCachedSpecies(): Promise<
  Array<{ speciesId: string; displayName: string; emoji: string }>
> {
  const dir = cacheDir();
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }

  const results: Array<{ speciesId: string; displayName: string; emoji: string }> = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await readFile(join(dir, file), 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.speciesId && parsed.meta) {
        results.push({
          speciesId: parsed.speciesId,
          displayName: parsed.meta.displayName,
          emoji: parsed.meta.emoji ?? '🐾',
        });
      }
    } catch {
      // Skip corrupted / unreadable entries
    }
  }

  return results;
}
