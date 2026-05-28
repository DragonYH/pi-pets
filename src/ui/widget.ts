import type { PetEngine } from '../pet_instance.ts';
import { stageDisplayName } from '../evolution.ts';
import { getCodexFrame, getCurrentAnimation } from '../codex/art-provider.ts';
import { visualLen, visualPadStart, visualPadEnd, visualClamp } from './visual-utils.ts';


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

  // Codex art (5 rows from half-block rendering)
  const codexState = getCurrentAnimation(s.emotion);
  const art = getCodexFrame(s.bones.species, codexState, animationFrame);
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

  // Bubble line
  // CJK-aware bubble: slice & pad by visual width
  let bubbleText = '';
  for (const ch of lastBubble) {
    if (visualLen(bubbleText + ch) > I - 3) break;
    bubbleText += ch;
  }
  lines.push(`│💬 ${visualPadEnd(bubbleText, I - 3)}│`);

  // Stats line: H/E + emotion
  const happinessLabel = s.bones.isShiny ? 'SHINY' : 'Happy';
  const stats = `H:${String(s.needs.hunger).padStart(3)} E:${String(s.needs.energy).padStart(3)} ${engine.emotionEmoji} ${happinessLabel}`;
  // CJK-aware: happinessLabel may be non-ASCII, emotionEmoji is 2-col
  lines.push(`└${'─'.repeat(I)}┘`);

  return lines;
}
