import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import type { PetState } from './types.ts';
import { CONFIG } from './config.ts';

/**
 * Persistence manager for pet state.
 * Stores state as JSON in ~/.pi/pets/state.json.
 */
export class Persistence {
  private filePath: string;

  constructor(baseDir?: string) {
    const dir = baseDir || homedir();
    this.filePath = resolve(dir, CONFIG.PERSISTENCE_PATH);
  }

  get path(): string {
    return this.filePath;
  }

  async save(state: PetState): Promise<void> {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    const data = JSON.stringify(state, null, 2);
    await writeFile(this.filePath, data, 'utf-8');
  }

  async load(): Promise<PetState | null> {
    try {
      if (!existsSync(this.filePath)) return null;
      const data = await readFile(this.filePath, 'utf-8');
      const raw = JSON.parse(data) as unknown;

      return migrate(raw);
    } catch {
      return null;
    }
  }

  /** Delete the state file (used on release). */
  async delete(): Promise<void> {
    try {
      const { rm } = await import('node:fs/promises');
      if (existsSync(this.filePath)) {
        await rm(this.filePath);
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Migration helper. Currently only version 1 exists.
 */
function migrate(raw: unknown): PetState | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  // Validate version
  const version = obj.version;
  if (typeof version !== 'number' || version > CONFIG.STATE_VERSION) {
    return null; // unknown future version
  }

  // For version 1, just validate shape
  if (version === 1) {
    if (
      typeof obj.id !== 'string' ||
      typeof obj.seed !== 'number' ||
      !obj.bones ||
      typeof obj.name !== 'string'
    ) {
      return null;
    }
    return obj as PetState;
  }

  return null;
}
