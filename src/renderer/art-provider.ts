import { loadCache } from './cache.ts';
import type { AnimationState, CacheEntry } from '../types.ts';

/**
 * In-memory cache of loaded pet frames.
 * Populated by calling loadPet() once per pet species.
 */
const frameCache = new Map<string, CacheEntry>();

/**
 * Check if the terminal supports true color (24-bit).
 */
function supportsTrueColor(): boolean {
  // If NO_COLOR is set, never use ANSI color
  if (process.env.NO_COLOR !== undefined) {
    return false;
  }

  const colorterm = process.env.COLORTERM ?? '';
  if (colorterm === 'truecolor' || colorterm === '24bit') {
    return true;
  }

  const term = process.env.TERM ?? '';
  if (term === 'xterm-256color' || term === 'xterm' || term === 'xterm-kitty') {
    return true;
  }

  // Default to false for safety
  return false;
}

/**
 * Map pi-pets EmotionState to AnimationState.
 */
export function emotionToAnimState(emotion: string): AnimationState {
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
 * Map special events to AnimationState.
 */
export function eventToAnimState(event: string): AnimationState {
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
let animationOverride: AnimationState | null = null;
let overrideExpiresAt: number = 0;

export function setAnimationOverride(state: AnimationState, durationMs: number = 2000) {
  animationOverride = state;
  overrideExpiresAt = Date.now() + durationMs;
}

/**
 * Get the current animation state, checking overrides first.
 * Falls back to emotion mapping if no active override.
 */
export function getCurrentAnimation(emotion: string): AnimationState {
  if (animationOverride && Date.now() < overrideExpiresAt) {
    return animationOverride;
  }
  return emotionToAnimState(emotion);
}

/**
 * Preload a pet's cached frames into memory.
 * Must be called once per pet species before getFrame().
 *
 * @param speciesId - The species identifier (cache key)
 */
export async function loadPet(speciesId: string): Promise<void> {
  if (frameCache.has(speciesId)) return; // Already loaded

  const entry = await loadCache(speciesId);
  if (!entry) {
    throw new Error(
      `Pet "${speciesId}" not imported yet. Use '/pets import <path>' to import its pet.json + spritesheet.webp.`,
    );
  }
  frameCache.set(speciesId, entry);
}

/**
 * Check if a pet is loaded in memory.
 */
export function isPetLoaded(speciesId: string): boolean {
  return frameCache.has(speciesId);
}

/**
 * Get a rendered frame for a pet from the in-memory cache.
 *
 * This is synchronous — the async loadPet() must be called first
 * (e.g., during session start).
 *
 * Uses ANSI true-color half-block rendering for best visual quality.
 * Falls back to text when true color is not supported.
 *
 * @param speciesId - The species identifier (cache key)
 * @param state - The animation state to render
 * @param frameIndex - Index of the frame (0-3)
 * @returns Array of rendered lines, or empty array if species not loaded
 */
export function getFrame(
  speciesId: string,
  state: AnimationState,
  frameIndex: number,
): string[] {
  const entry = frameCache.get(speciesId);
  if (!entry) return [];

  // Prefer ANSI half-block frames, fallback to text
  const useAnsi = supportsTrueColor();
  const sourceFrames = useAnsi ? entry.frames : entry.textFallback;
  const stateFrames = sourceFrames[state] ?? sourceFrames['idle'] ?? null;
  if (!stateFrames || stateFrames.length === 0) {
    return [];
  }

  const safeIndex = frameIndex % stateFrames.length;
  return stateFrames[safeIndex] ?? [];
}
