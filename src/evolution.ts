import type { GrowthStage } from './types.js';
import { CONFIG } from './config.js';
import { t } from './i18n/index.js';

/**
 * Determine growth stage from level.
 */
export function getStage(level: number): GrowthStage {
  const t = CONFIG.GROWTH_THRESHOLDS;
  if (level >= t.elder.minLevel) return 'elder';
  if (level >= t.adult.minLevel) return 'adult';
  if (level >= t.teen.minLevel) return 'teen';
  if (level >= t.child.minLevel) return 'child';
  return 'baby';
}

/**
 * Get the display name for a growth stage (i18n).
 */
export function stageDisplayName(stage: GrowthStage): string {
  return t(`stage_${stage}`);
}

/**
 * Check if this is a stage transition event.
 */
export function isStageTransition(oldLevel: number, newLevel: number): GrowthStage | null {
  if (oldLevel === newLevel) return null;
  const oldStage = getStage(oldLevel);
  const newStage = getStage(newLevel);
  return oldStage !== newStage ? newStage : null;
}
