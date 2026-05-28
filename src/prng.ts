/**
 * Mulberry32 — a fast, seedable 32-bit PRNG.
 * Returns a { next() } yielding floats in [0, 1).
 */

export function mulberry32(seed: number): { next(): number } {
  let state = seed | 0;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/**
 * Hash a string into a 32-bit integer using a simple FNV-1a-like hash.
 */
export function hashString(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // ensure unsigned
}

export interface PRNG {
  next(): number;
  /** Pick a random element from an array */
  pick<T>(arr: T[]): T;
  /** Roll a weighted pick: returns the key whose weight range the roll falls into */
  pickWeighted(weights: Record<string, number>): string;
  /** Return [0, max) integer */
  int(max: number): number;
}

export function createPrng(seed: number): PRNG {
  const rng = mulberry32(seed);

  return {
    next(): number {
      return rng.next();
    },

    pick<T>(arr: T[]): T {
      return arr[Math.floor(rng.next() * arr.length)];
    },

    pickWeighted(weights: Record<string, number>): string {
      const entries = Object.entries(weights);
      const total = entries.reduce((sum, [, w]) => sum + w, 0);
      let roll = rng.next() * total;
      for (const [key, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return key;
      }
      return entries[entries.length - 1][0];
    },

    int(max: number): number {
      return Math.floor(rng.next() * max);
    },
  };
}
