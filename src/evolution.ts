import type { GrowthStage } from './types.ts';
import { CONFIG } from './config.ts';

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
 * Get the display name for a growth stage (Chinese).
 */
export function stageDisplayName(stage: GrowthStage): string {
  const names: Record<GrowthStage, string> = {
    baby: '幼生体',
    child: '成长体',
    teen: '进化体',
    adult: '完全体',
    elder: '究极体',
  };
  return names[stage];
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
