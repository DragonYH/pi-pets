// eslint-disable-next-line
interface Component { render(width: number): string[]; invalidate(): void; }
// eslint-disable-next-line
type TUI = any;
import type { PetEngine } from '../pet_instance.ts';
import { getCodexFrame, getCurrentAnimation } from '../codex/art-provider.ts';
import { getRandomBubble } from './bubbles.ts';
import { stageDisplayName } from '../evolution.ts';
import { visualLen, visualPadStart, visualPadEnd, visualClamp } from './visual-utils.ts';




/**
 * Non-capturing overlay component that renders the pet panel
 * at the top-right of the terminal, without intercepting keyboard input.
 */
export class PetOverlayComponent implements Component {
  private engine: PetEngine;
  private tui: TUI;
  private animTimer: ReturnType<typeof setInterval> | null = null;
  animationFrame = 0;

  constructor(engine: PetEngine, tui: TUI) {
    this.engine = engine;
    this.tui = tui;
    this.startAnimation();
  }

  private startAnimation() {
    this.animTimer = setInterval(() => {
      this.animationFrame = (this.animationFrame + 1) % 4;
      this.tui.requestRender();
    }, 500);
  }

  // NO handleInput — this panel does NOT capture keyboard input

  render(width: number): string[] {
    if (!this.engine.hasPet || !this.engine.state) return [];

    const s = this.engine.state;
    const innerW = Math.max(1, width - 2);
    const lines: string[] = [];

    // ┌──────────┐
    lines.push(`╭${'─'.repeat(innerW)}╮`);

    // Codex art (5 rows from half-block rendering)
    const codexState = getCurrentAnimation(s.emotion);
    const art = getCodexFrame(s.bones.species, codexState, this.animationFrame);
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
    const bubble = this.engine.currentBubble || getRandomBubble(s.emotion);
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

  invalidate(): void {}

  dispose(): void {
    if (this.animTimer) {
      clearInterval(this.animTimer);
      this.animTimer = null;
    }
  }
}
