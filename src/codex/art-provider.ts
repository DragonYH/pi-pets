import { loadCache } from './cache.ts';
import { supportsTrueColor } from './terminal-detect.ts';
import type { CodexAnimationState, CodexCacheEntry } from '../types.ts';

/**
 * In-memory cache of loaded Codex pet frames.
 * Populated by calling loadCodexPet() once per pet species.
 */
const frameCache = new Map<string, CodexCacheEntry>();

/**
 * Map pi-pets EmotionState to CodexAnimationState.
 */
export function emotionToCodexState(emotion: string): CodexAnimationState {
  switch (emotion) {
    case 'happy':
    case 'curious':
      return 'idle';
    case 'excited':
      return 'run';
    case 'tired':
      return 'sleep';
    case 'hungry':
      return 'eat';
    case 'frustrated':
      return 'attack';
    case 'sick':
      return 'hurt';
    default:
      return 'idle';
  }
}

/**
 * Map special events to CodexAnimationState.
 */
export function eventToCodexState(event: string): CodexAnimationState {
  switch (event) {
    case 'evolve':
      return 'jump';
    case 'pet':
      return 'play';
    case 'tests_pass':
      return 'run';
    default:
      return 'idle';
  }
}

/**
 * Animation override state — set by special events (evolve, pet).
 */
let animationOverride: CodexAnimationState | null = null;
let overrideExpiresAt: number = 0;

export function setAnimationOverride(state: CodexAnimationState, durationMs: number = 2000) {
  animationOverride = state;
  overrideExpiresAt = Date.now() + durationMs;
}

/**
 * Get the current animation state, checking overrides first.
 * Falls back to emotion mapping if no active override.
 */
export function getCurrentAnimation(emotion: string): CodexAnimationState {
  if (animationOverride && Date.now() < overrideExpiresAt) {
    return animationOverride;
  }
  return emotionToCodexState(emotion);
}
/**
 * Preload a Codex pet's cached frames into memory.
 * Must be called once per pet species before getCodexFrame().
 *
 * @param speciesId - The species identifier (cache key)
 */
export async function loadCodexPet(speciesId: string): Promise<void> {
  if (frameCache.has(speciesId)) return; // Already loaded

  const entry = await loadCache(speciesId);
  if (!entry) {
    throw new Error(
      `Codex pet "${speciesId}" not imported yet. Use '/pets import <path>' to import its pet.json + spritesheet.webp.`,
    );
  }
  frameCache.set(speciesId, entry);
}

/**
 * Check if a Codex pet is loaded in memory.
 */
export function isCodexPetLoaded(speciesId: string): boolean {
  return frameCache.has(speciesId);
}

/**
 * Get a rendered frame for a Codex pet from the in-memory cache.
 *
 * This is synchronous — the async loadCodexPet() must be called first
 * (e.g., during session start).
 *
 * Uses ANSI true-color half-block rendering for best visual quality.
 * Falls back to ASCII when true color is not supported.
 *
 * @param speciesId - The species identifier (cache key)
 * @param state - The animation state to render
 * @param frameIndex - Index of the frame (0-3)
 * @returns Array of rendered lines, or empty array if species not loaded
 */
export function getCodexFrame(
  speciesId: string,
  state: CodexAnimationState,
  frameIndex: number,
): string[] {
  const entry = frameCache.get(speciesId);
  if (!entry) return [];

  // Prefer ANSI half-block frames, fallback to ASCII
  const useAnsi = supportsTrueColor();
  const sourceFrames = useAnsi ? entry.frames : entry.asciiFallback;
  const stateFrames = sourceFrames[state] ?? sourceFrames['idle'] ?? null;
  if (!stateFrames || stateFrames.length === 0) {
    return [];
  }

  const safeIndex = frameIndex % stateFrames.length;
  return stateFrames[safeIndex] ?? [];
}
