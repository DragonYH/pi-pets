import type { PetEngine } from '../pet_instance.ts';
import type { SpeciesId } from '../types.ts';
import { STAT_KEYS } from '../types.ts';
import { stageDisplayName } from '../evolution.ts';
import { FRAMES as PYROFOX_FRAMES } from './art/pyrofox.ts';
import { FRAMES as RUSTACEAN_FRAMES } from './art/rustacean.ts';
import { FRAMES as PYTHONIDAE_FRAMES } from './art/pythonidae.ts';



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

  // ASCII art (if available)
  const art = getArtLines(s.bones.species, animationFrame);
  if (art.length > 0) {
    for (const row of art) {
      // Center the art inside the widget
      const padded = row.padStart(Math.floor((26 + row.length) / 2));
      lines.push(`│ ${padded.padEnd(24)}│`);
    }
  }

  // Info section
  const rarityMap: Record<string, string> = {
    common: '普通', uncommon: '稀有', rare: '精良', epic: '史诗', legendary: '传说',
  };
  const rarityLabel = rarityMap[s.bones.rarity] ?? s.bones.rarity;
  const shinyMark = s.bones.isShiny ? '✨ ' : '';
  const stageLabel = stageDisplayName(s.stage);

  const infoLines = [
    `  ${shinyMark}${s.bones.species.toUpperCase()}`,
    `  "${s.name}"`,
    `  Lv.${s.level} ${stageLabel}`,
    `  稀有度: ${rarityLabel}${s.bones.isShiny ? ' ✨闪亮' : ''}`,
    '',
  ];

  for (const line of infoLines) {
    lines.push(`│ ${line.padEnd(24)}│`);
  }

  // Stats bars
  const statNames: Record<string, string> = {
    debugging: 'DEBUGGING',
    patience: 'PATIENCE',
    chaos: 'CHAOS',
    wisdom: 'WISDOM',
    snark: 'SNARK',
  };

  for (const key of STAT_KEYS) {
    const val = s.bones.baseStats[key];
    const barLen = Math.round(val / 5); // 0-20 chars
    const bar = '█'.repeat(Math.max(0, barLen));
    const empty = '░'.repeat(Math.max(0, 20 - barLen));
    lines.push(`│ ${statNames[key].padEnd(9)} ${bar}${empty} ${val.toString().padStart(3)}│`);
  }

  // Bubble
  lines.push(`│                          │`);
  lines.push(`│ 💬 "${lastBubble.slice(0, 18).padEnd(18)}"│`);

  // Bottom border
  lines.push('└──────────────────────────┘');

  return lines;
}

function getArtLines(species: SpeciesId, frame: number): string[] {
  let frames: string[][];

  switch (species) {
    case 'pyrofox':
      frames = PYROFOX_FRAMES;
      break;
    case 'rustacean':
      frames = RUSTACEAN_FRAMES;
      break;
    case 'pythonidae':
      frames = PYTHONIDAE_FRAMES;
      break;
    default:
      frames = getGenericArt();
      break;
  }

  if (!frames || frames.length === 0) return [];
  const safeFrame = frame % frames.length;
  return frames[safeFrame] ?? [];
}

function getGenericArt(): string[][] {
  return [
    [
      '  ( o o )  ',
      '  (  ~  )  ',
      '  (_____)  ',
      '           ',
      '           ',
    ],
    [
      '  ( - - )  ',
      '  (  ~  )  ',
      '  (_____)  ',
      '           ',
      '           ',
    ],
    [
      '  ( o o )  ',
      '  (  >  )  ',
      '  (_____)  ',
      '           ',
      '           ',
    ],
    [
      '  ( ^ ^ )  ',
      '  (  ~  )  ',
      '  (_____)  ',
      '           ',
      '           ',
    ],
  ];
}
