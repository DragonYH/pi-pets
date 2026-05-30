import type { PetEngine } from '../pet_instance.ts';
import { stageDisplayName } from '../evolution.ts';
import { getSpecies } from '../species.ts';
import { getFrame, getCurrentAnimation } from '../renderer/art-provider.ts';
import { visualLen, visualPadStart, visualPadEnd, visualClamp, visualWrap } from './visual-utils.ts';


/** Widget constants — every line is exactly W chars. */
const W = 28;  // total widget width (incl. box-drawing characters)
const I = 26;  // inner content width between │ and │

/**
 * Build widget panel lines for the pet.
 * Border-to-border width is exactly W (28 chars).
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
  lines.push(`┌${'─'.repeat(I)}┐`);

  // Empty spacer
  lines.push(`│${' '.repeat(I)}│`);

  // Pet art from half-block rendering
  const animState = getCurrentAnimation(s.emotion);
  const art = getFrame(s.bones.species, animState, animationFrame);
  if (art.length > 0) {
    for (const row of art) {
      const clamped = visualClamp(row, I);
      const centered = visualPadStart(clamped, Math.floor((I + visualLen(clamped)) / 2));
      lines.push(`│${visualPadEnd(centered, I)}│`);
    }
  } else {
    // Fallback: no art loaded — show placeholder
    const placeholder = '~~ 未导入 ~~';
    const vLen = visualLen(placeholder);
    const left = Math.floor((I - vLen) / 2);
    lines.push(`│${' '.repeat(left)}${placeholder}${' '.repeat(I - left - vLen)}│`);
  }

  // Empty spacer
  lines.push(`│${' '.repeat(I)}│`);

  // Info line 1: name(species) left, Lv.x stageLabel right
  const shinyMark = s.bones.isShiny ? '✨' : '';
  const speciesName = getSpecies(s.bones.species).name;
  const stageLabel = stageDisplayName(s.stage);
  const leftStr = `${shinyMark}${s.name}(${speciesName})`;
  const rightStr = `Lv.${s.level} ${stageLabel}`;
  const rightLen = visualLen(rightStr);
  const maxLeftW = I - rightLen;
  if (visualLen(leftStr) <= maxLeftW) {
    lines.push(`│${visualPadEnd(leftStr, maxLeftW)}${rightStr}│`);
  } else {
    const safeLeft = visualClamp(leftStr, Math.max(0, maxLeftW - 1)) + '…';
    lines.push(`│${visualPadEnd(safeLeft, maxLeftW)}${rightStr}│`);
  }

  // Info line 2: rarity, emotion, XP
  const rarityMap: Record<string, string> = {
    common: '普通', uncommon: '稀有', rare: '精良', epic: '史诗', legendary: '传说',
  };
  const rarityLabel = rarityMap[s.bones.rarity] ?? s.bones.rarity;
  const xpStr = `${s.xp}XP`;
  const line2 = `${rarityLabel} ${engine.emotionEmoji} ${xpStr}`;
  lines.push(`│${visualPadEnd(line2, I)}│`);

  // Separator
  lines.push(`│${'─'.repeat(I)}│`);

  // Bubble: up to 2 lines with visual wrap
  const bubbleLines = visualWrap(lastBubble, I - 3).slice(0, 2);
  if (bubbleLines.length > 0) {
    lines.push(`│💬 ${visualPadEnd(bubbleLines[0], I - 3)}│`);
    if (bubbleLines.length > 1) {
      // Continuation — indent 2 spaces
      lines.push(`│  ${visualPadEnd(bubbleLines[1], I - 2)}│`);
    }
  } else {
    lines.push(`│💬 ${visualPadEnd('', I - 3)}│`);
  }

  // Stats: scannable emoji-label format
  const h = Math.round(s.needs.hunger);
  const e = Math.round(s.needs.energy);
  const hap = Math.round(s.needs.happiness);
  lines.push(`│${visualPadEnd(visualClamp(`🍖${h} ⚡${e} 😊${hap}`, I), I)}│`);
  lines.push(`└${'─'.repeat(I)}┘`);

  return lines;
}
