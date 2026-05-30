import type { EmotionState } from '../types.js';
import { t } from '../i18n/index.js';

/**
 * Random bubble messages per emotion state (i18n).
 * Keys in translation dictionaries: bubble_{emotion}_{index}
 */
const BUBBLE_COUNT: Record<EmotionState, number> = {
  happy: 5,
  curious: 5,
  excited: 5,
  tired: 5,
  hungry: 5,
  frustrated: 5,
  sick: 5,
  working: 6,
};

export function getRandomBubble(state: EmotionState): string {
  const count = BUBBLE_COUNT[state] ?? 5;
  const idx = Math.floor(Math.random() * count);
  return t(`bubble_${state}_${idx}`);
}
