import type { GrowthStage } from '../types.ts';
import { stageDisplayName } from '../evolution.ts';

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
    `║${center('⬆ LEVEL UP! ⬆')}║`,
    `║${center(`${name} 升到 Lv.${newLevel}！`)}║`,
    '║                              ║',
    '╚══════════════════════════════╝',
  ];
}

export function evolutionOverlay(name: string, newStage: GrowthStage): string[] {
  const stageName = stageDisplayName(newStage);
  return [
    '╔══════════════════════════════╗',
    '║          ★ ☆ ★              ║',
    '║       EVOLUTION!            ║',
    `║${center(`${name} 进化！`)}║`,
    `║${center(`→ ${stageName}`)}║`,
    '║          ★ ☆ ★              ║',
    '╚══════════════════════════════╝',
  ];
}
