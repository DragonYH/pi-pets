// eslint-disable-next-line
interface Component { render(width: number): string[]; invalidate(): void; }
// eslint-disable-next-line
type TUI = any;
import type { PetEngine } from '../pet_instance.ts';
import { getFrame, getCurrentAnimation, getFrameCount } from '../renderer/art-provider.ts';
import { getRandomBubble } from './bubbles.ts';
import type { EmotionState } from '../types.ts';
import { stageDisplayName } from '../evolution.ts';
import { visualLen, visualPadStart, visualPadEnd, visualClamp } from './visual-utils.ts';

import { CONFIG } from '../config.ts';




/**
 * Non-capturing overlay component that renders the pet panel
 * at the top-right of the terminal, without intercepting keyboard input.
 */
export class PetOverlayComponent implements Component {
  private engine: PetEngine;
  private tui: TUI;
  private animTimer: ReturnType<typeof setInterval> | null = null;
  private cachedBubble: string = '';
  private lastBubbleEmotion: EmotionState | null = null;
  animationFrame = 0;

  constructor(engine: PetEngine, tui: TUI) {
    this.engine = engine;
    this.tui = tui;
    this.startAnimation();
  }

  private startAnimation() {
    this.animTimer = setInterval(() => {
      // Determine current frame count from the engine state
      let frameCount = 1; // fallback default (avoid modulo 0)
      if (this.engine.state) {
        const animState = getCurrentAnimation(this.engine.state.emotion);
        const count = getFrameCount(this.engine.state.bones.species, animState);
        if (count > 0) frameCount = count;
      }
      this.animationFrame = (this.animationFrame + 1) % frameCount;
      this.tui.requestRender();
    }, 200);
  }

  // NO handleInput — this panel does NOT capture keyboard input

  render(width: number): string[] {
    if (!this.engine.hasPet || !this.engine.state) return [];

    const termRows = (this.tui as any)?.terminal?.rows;
    if (typeof termRows === 'number' && termRows < CONFIG.OVERLAY_COMPACT_MIN_ROWS) return [];
    if (typeof termRows === 'number' && termRows < CONFIG.OVERLAY_FULL_MIN_ROWS) return this.renderCompact(width);

    const s = this.engine.state;
    const innerW = Math.max(1, width - 2);
    const lines: string[] = [];

    // ┌──────────┐
    lines.push(`╭${'─'.repeat(innerW)}╮`);

    // Pet art from half-block rendering
    const animState = getCurrentAnimation(s.emotion);
    const art = getFrame(s.bones.species, animState, this.animationFrame);
    if (art.length > 0) {
      for (const row of art) {
        const clamped = visualClamp(row, innerW);
        const centered = visualPadStart(clamped, Math.floor((innerW + visualLen(clamped)) / 2));
        lines.push(`│${visualPadEnd(centered, innerW)}│`);
      }
    } else {
      // Fallback: no art loaded — show placeholder
      const placeholder = '~~ no pet ~~';
      const vLen = visualLen(placeholder);
      const left = Math.floor((innerW - vLen) / 2);
      lines.push(`│${' '.repeat(left)}${placeholder}${' '.repeat(innerW - left - vLen)}│`);
    }

    // Info line 1: species (uppercase) + name right-aligned
    const shinyMark = s.bones.isShiny ? '✨ ' : '';
    const speciesLabel = `${shinyMark}${s.bones.species.toUpperCase()}`;
    const nameDisplay = visualLen(s.name) > 14 ? visualClamp(s.name, 13) + '\u2026' : s.name;
    const speciesW = Math.min(10, innerW);
    lines.push(`│${visualPadEnd(speciesLabel, speciesW)}${visualPadStart(nameDisplay, innerW - speciesW)}│`);

    // Info line 2: Lv, stage
    const stageLabel = stageDisplayName(s.stage);
    lines.push(`│${visualPadEnd(`Lv.${s.level} ${stageLabel}`, innerW)}│`);

    // Separator
    lines.push(`│${'─'.repeat(innerW)}│`);

    // Bubble line
    const bubble = this.resolveBubble(s.emotion);
    let bubbleText = '';
    for (const ch of bubble) {
      if (visualLen(bubbleText + ch) > innerW - 3) break;
      bubbleText += ch;
    }
    lines.push(`│💬 ${visualPadEnd(bubbleText, innerW - 3)}│`);

    // Stats line
    const h = Math.round(s.needs.hunger);
    const e = Math.round(s.needs.energy);
    const hap = Math.round(s.needs.happiness);
    const statsStr = `H:${String(h).padStart(3)} E:${String(e).padStart(3)} ${this.engine.emotionEmoji} ${String(hap).padStart(3)}`;
    lines.push(`│${visualPadEnd(visualClamp(statsStr, innerW), innerW)}│`);

    // └──────────┘
    lines.push(`╰${'─'.repeat(innerW)}╯`);
    return lines;
  }

  private renderCompact(width: number): string[] {
    const s = this.engine.state!;
    const innerW = Math.max(1, width - 2);
    const lines: string[] = [];

    // ┌──────────┐
    lines.push(`╭${'─'.repeat(innerW)}╮`);

    // Info line 1: species (uppercase) + name right-aligned
    const shinyMark = s.bones.isShiny ? '✨ ' : '';
    const speciesLabel = `${shinyMark}${s.bones.species.toUpperCase()}`;
    const nameDisplay = visualLen(s.name) > 14 ? visualClamp(s.name, 13) + '…' : s.name;
    const speciesW = Math.min(10, innerW);
    lines.push(`│${visualPadEnd(speciesLabel, speciesW)}${visualPadStart(nameDisplay, innerW - speciesW)}│`);

    // Info line 2: Lv, stage
    const stageLabel = stageDisplayName(s.stage);
    lines.push(`│${visualPadEnd(`Lv.${s.level} ${stageLabel}`, innerW)}│`);

    // Bubble line
    const bubble = this.resolveBubble(s.emotion);
    let bubbleText = '';
    for (const ch of bubble) {
      if (visualLen(bubbleText + ch) > innerW - 3) break;
      bubbleText += ch;
    }
    lines.push(`│💬 ${visualPadEnd(bubbleText, innerW - 3)}│`);

    // Stats line
    const h = Math.round(s.needs.hunger);
    const e = Math.round(s.needs.energy);
    const hap = Math.round(s.needs.happiness);
    const statsStr = `H:${String(h).padStart(3)} E:${String(e).padStart(3)} ${this.engine.emotionEmoji} ${String(hap).padStart(3)}`;
    lines.push(`│${visualPadEnd(visualClamp(statsStr, innerW), innerW)}│`);

    // └──────────┘
    lines.push(`╰${'─'.repeat(innerW)}╯`);
    return lines;
  }

  private resolveBubble(emotion: EmotionState): string {
    if (this.engine.currentBubble) {
      // Engine explicitly set a bubble — use and cache it
      this.cachedBubble = this.engine.currentBubble;
      this.lastBubbleEmotion = emotion;
      return this.cachedBubble;
    }
    if (emotion !== this.lastBubbleEmotion) {
      // Emotion changed — pick a new random bubble
      this.cachedBubble = getRandomBubble(emotion);
      this.lastBubbleEmotion = emotion;
    }
    // Reuse cached bubble (stable across render calls)
    return this.cachedBubble;
  }

  invalidate(): void {}

  dispose(): void {
    if (this.animTimer) {
      clearInterval(this.animTimer);
      this.animTimer = null;
    }
  }
}
