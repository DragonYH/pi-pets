import type { PetEngine } from '../pet_instance.ts';
import { stageDisplayName } from '../evolution.ts';
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

  // Info line 1: species (uppercase) + name right-aligned
  const shinyMark = s.bones.isShiny ? '✨ ' : '';
  const speciesLabel = `${shinyMark}${s.bones.species.toUpperCase()}`;
  const nameDisplay = visualLen(s.name) > 14 ? visualClamp(s.name, 13) + '\u2026' : s.name;
  const speciesW = Math.min(10, I);
  lines.push(`│${visualPadEnd(speciesLabel, speciesW)}${visualPadStart(nameDisplay, I - speciesW)}│`);

  // Info line 2: Lv, stage, rarity, emotion, XP
  const stageLabel = stageDisplayName(s.stage);
  const rarityMap: Record<string, string> = {
    common: '普通', uncommon: '稀有', rare: '精良', epic: '史诗', legendary: '传说',
  };
  const rarityLabel = rarityMap[s.bones.rarity] ?? s.bones.rarity;
  const levelStr = `Lv.${s.level}`;
  const xpStr = `${s.xp}XP`;
  const line2 = `${levelStr} ${stageLabel} ${shinyMark}${rarityLabel} ${engine.emotionEmoji} ${xpStr}`;
  // CJK-aware: rarity/stage names are Chinese, shiny/emotion are emoji
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
