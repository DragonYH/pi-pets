import type { PetEngine } from '../pet_instance.ts';
import { stageDisplayName } from '../evolution.ts';
import { getCodexFrame, getCurrentAnimation } from '../codex/art-provider.ts';

/** Strip ANSI escape sequences to count visible characters only. */
const ANSI_RE = /\x1b\[[0-9;]*m/g;
const visualLen = (s: string) => s.replace(ANSI_RE, '').length;
const visualPadStart = (s: string, w: number, ch = ' ') => { const d = w - visualLen(s); return d > 0 ? ch.repeat(d) + s : s; };
const visualPadEnd = (s: string, w: number, ch = ' ') => { const d = w - visualLen(s); return d > 0 ? s + ch.repeat(d) : s; };

/**

/**
 * Build widget panel lines for the pet.
 * The widget shows ASCII art, species info, stats bars, and a bubble.
 */
export function buildWidget(
  engine: PetEngine,
  animationFrame: number,
  lastBubble: string,
): string[] {
  if (!engine.hasPet || !engine.state) return [];

  const s = engine.state;
  const lines: string[] = [];

  // Top border
  lines.push('┌──────────────────────────┐');
  // Codex ASCII art (5 lines, matching original art height)
  const panelW = 24;
  const codexState = getCurrentAnimation(s.emotion);
  const art = getCodexFrame(s.bones.species, codexState, animationFrame);
  if (art.length > 0) {
    for (const row of art) {
      // Center the art inside the widget (panelW chars wide)
      const vw = visualLen(row);
      const centered = visualPadStart(row, Math.floor((panelW + visualLen(row)) / 2));
      lines.push(`│ ${visualPadEnd(centered, panelW)}│`);
    }
  } else {
    // Fallback: no art loaded
    lines.push(`│ ${'~'.repeat(panelW)}│`);
  }

  // Empty separator
  lines.push(`│ ${''.padEnd(24)}│`);

  // Compact info: species + name
  const shinyMark = s.bones.isShiny ? '✨ ' : '';
  const stageLabel = stageDisplayName(s.stage);
  const rarityMap: Record<string, string> = {
    common: '普通', uncommon: '稀有', rare: '精良', epic: '史诗', legendary: '传说',
  };
  const rarityLabel = rarityMap[s.bones.rarity] ?? s.bones.rarity;
  const nameDisplay = s.name.length > 10 ? s.name.slice(0, 9) + '…' : s.name;

  lines.push(`│ ${shinyMark}${s.bones.species.toUpperCase().padEnd(10)}${nameDisplay.padStart(14)}│`);
  lines.push(`│  Lv.${s.level} ${stageLabel} ${shinyMark}${rarityLabel.padEnd(4)} ${engine.emotionEmoji.padEnd(2)}${String(s.xp).padStart(5)}XP│`);

  // Empty separator
  lines.push(`│ ${''.padEnd(24)}│`);

  // Compact stats: H/E + emotion
  const happinessLabel = s.bones.isShiny ? 'SHINY' : 'Happy';
  lines.push(`│ H:${String(s.needs.hunger).padStart(3)} E:${String(s.needs.energy).padStart(3)} ${engine.emotionEmoji} ${happinessLabel.padStart(5)}│`);
  lines.push(`│ 💬 "${lastBubble.slice(0, 18).padEnd(18)}"│`);

  // Bottom border
  lines.push('└──────────────────────────┘');

  return lines;
}

