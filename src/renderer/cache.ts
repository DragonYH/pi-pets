import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { CONFIG } from '../config.ts';
import type { CacheEntry } from '../types.ts';

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
    // Basic validation
    if (parsed && parsed.speciesId === speciesId && parsed.frames) {
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
