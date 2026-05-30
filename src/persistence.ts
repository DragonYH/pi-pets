import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { PetState } from './types.js';
import { CONFIG } from './config.js';

/**
 * Persistence manager for n independent pet states.
 * Each pet gets its own file in ~/.pi/agent/pets/pets/<petId>.json.
 * Active pet is tracked via ~/.pi/agent/pets/active.json.
 */
export class Persistence {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || homedir();
  }

  private get petsDir(): string {
    return resolve(this.baseDir, CONFIG.PETS_DIR);
  }

  private get activeFilePath(): string {
    return resolve(this.baseDir, CONFIG.ACTIVE_PET_PATH);
  }

  private petPath(id: string): string {
    return join(this.petsDir, `${id}.json`);
  }

  // ---- Dir helpers ----

  private async ensurePetsDir(): Promise<void> {
    const dir = this.petsDir;
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  // ---- Active pointer ----

  /** Get the active pet ID, or null if none set. */
  async getActivePetId(): Promise<string | null> {
    const path = this.activeFilePath;
    try {
      if (!existsSync(path)) return null;
      const data = await readFile(path, 'utf-8');
      const raw = JSON.parse(data) as { activePetId?: string };
      return raw.activePetId ?? null;
    } catch {
      return null;
    }
  }

  /** Set (or clear) the active pet ID. */
  async setActivePetId(id: string | null): Promise<void> {
    const path = this.activeFilePath;
    const dir = dirname(path);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    const data = JSON.stringify({ activePetId: id ?? null }, null, 2);
    const tmpPath = path + '.tmp';
    await writeFile(tmpPath, data, 'utf-8');
    const { rename } = await import('node:fs/promises');
    await rename(tmpPath, path);
  }

  // ---- Per-pet CRUD ----

  /** List all existing pet IDs (from filenames in pets dir). */
  async listPetIds(): Promise<string[]> {
    const dir = this.petsDir;
    try {
      if (!existsSync(dir)) return [];
      const files = await readdir(dir);
      return files
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''));
    } catch {
      return [];
    }
  }

  /** Load a specific pet's state by ID. Returns null if not found. */
  async loadPet(id: string): Promise<PetState | null> {
    const path = this.petPath(id);
    try {
      if (!existsSync(path)) return null;
      const data = await readFile(path, 'utf-8');
      const raw = JSON.parse(data) as unknown;
      return migrate(raw);
    } catch {
      return null;
    }
  }

  /** Save a pet's state to its own file. */
  async savePet(state: PetState): Promise<void> {
    await this.ensurePetsDir();
    const path = this.petPath(state.id);
    const data = JSON.stringify(state, null, 2);
    const tmpPath = path + '.tmp';
    await writeFile(tmpPath, data, 'utf-8');
    const { rename } = await import('node:fs/promises');
    await rename(tmpPath, path);
  }

  /** Delete a pet's state file by ID. */
  async deletePet(id: string): Promise<void> {
    const path = this.petPath(id);
    try {
      if (existsSync(path)) {
        await unlink(path);
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
    return obj as unknown as PetState;
  }

  return null;
}
