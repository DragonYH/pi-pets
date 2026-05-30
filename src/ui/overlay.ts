import type { GrowthStage } from '../types.js';
import { stageDisplayName } from '../evolution.js';
import { t } from '../i18n/index.js';

/**
 * Build overlay art for level-up or evolution events.
 * Returns lines to be displayed as a brief overlay.
 */

const OVERLAY_WIDTH = 32;

function center(text: string, width: number = OVERLAY_WIDTH): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(pad) + text;
}

export function levelUpOverlay(name: string, newLevel: number): string[] {
  return [
    '╔══════════════════════════════╗',
    '║                              ║',
    `║${center(t('overlay_level_up_title'))}║`,
    `║${center(t('overlay_level_up_message', { name, level: String(newLevel) }))}║`,
    '║                              ║',
    '╚══════════════════════════════╝',
  ];
}

export function evolutionOverlay(name: string, newStage: GrowthStage): string[] {
  const stageName = stageDisplayName(newStage);
  return [
    '╔══════════════════════════════╗',
    '║          ★ ☆ ★              ║',
    `║${center(t('overlay_evolution_title'))}║`,
    `║${center(t('overlay_evolution_message', { name }))}║`,
    `║${center(t('overlay_evolution_to', { stage: stageName }))}║`,
    '║          ★ ☆ ★              ║',
    '╚══════════════════════════════╝',
  ];
}
