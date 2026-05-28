// eslint-disable-next-line
interface Component { render(width: number): string[]; invalidate(): void; }
// eslint-disable-next-line
type TUI = any;
import type { PetEngine } from '../pet_instance.ts';
import { getCodexFrame, getCurrentAnimation } from '../codex/art-provider.ts';
import { getRandomBubble } from './bubbles.ts';
import { stageDisplayName } from '../evolution.ts';

/** Strip ANSI escape sequences to count visible characters only. */
const ANSI_RE = /\x1b\[[0-9;]*m/g;
const visualLen = (s: string) => s.replace(ANSI_RE, '').length;
const visualPadStart = (s: string, w: number, ch = ' ') => {
  const d = w - visualLen(s);
  return d > 0 ? ch.repeat(d) + s : s;
};
const visualPadEnd = (s: string, w: number, ch = ' ') => {
  const d = w - visualLen(s);
  return d > 0 ? s + ch.repeat(d) : s;
};

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
        const centered = visualPadStart(row, Math.floor((innerW + visualLen(row)) / 2));
        lines.push(`│${visualPadEnd(centered, innerW)}│`);
      }
    } else {
      // Fallback: no art loaded — show placeholder
      const placeholder = '~~ no pet ~~';
      const left = Math.floor((innerW - placeholder.length) / 2);
      lines.push(`│${' '.repeat(left)}${placeholder}${' '.repeat(innerW - left - placeholder.length)}│`);
    }

    // Info line 1: species (uppercase) + name right-aligned
    const shinyMark = s.bones.isShiny ? '✨ ' : '';
    const speciesLabel = `${shinyMark}${s.bones.species.toUpperCase()}`;
    const nameDisplay = s.name.length > 14 ? s.name.slice(0, 13) + '...' : s.name;
    lines.push(`│${speciesLabel.padEnd(10)}${nameDisplay.padStart(innerW - 10)}│`);

    // Info line 2: Lv, stage
    const stageLabel = stageDisplayName(s.stage);
    lines.push(`│Lv.${s.level} ${stageLabel}${' '.repeat(Math.max(0, innerW - 2 - String(s.level).length - stageLabel.length))}│`);

    // Separator
    lines.push(`│${'─'.repeat(innerW)}│`);

    // Bubble line
    const bubble = this.engine.currentBubble || getRandomBubble(s.emotion);
    const bubbleText = bubble.slice(0, innerW - 3);
    lines.push(`│💬 ${visualPadEnd(bubbleText, innerW - 3)}│`);

    // Stats line
    const h = Math.round(s.needs.hunger);
    const e = Math.round(s.needs.energy);
    const hap = Math.round(s.needs.happiness);
    lines.push(`│H:${String(h).padStart(3)} E:${String(e).padStart(3)} ${this.engine.emotionEmoji} ${String(hap).padStart(3)}│`);

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
