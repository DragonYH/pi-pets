import type { PixelFrame } from './converter.ts';
import { CONFIG } from '../config.ts';

/**
 * Render a PixelFrame as an array of ANSI-encoded strings (12 lines).
 *
 * Algorithm: two vertical pixels form one character cell using Unicode half-blocks.
 *   - Both pixels the same color → '█' with that color as foreground.
 *   - Different colors → '▀' (upper half) with top pixel as foreground, bottom as background.
 *
 * Each line is padded to renderWidth characters and ends with \x1b[0m.
 *
 * @param frame - 26×24 RGBA pixel grid
 * @returns 12 ANSI strings
 */
export function renderAnsiFrame(frame: PixelFrame): string[] {
  const renderW = CONFIG.CODEX_RENDER_WIDTH;
  const renderH = CONFIG.CODEX_RENDER_HEIGHT;
  const outHeight = renderH / 2; // 12 lines for 24 pixels

  const lines: string[] = [];

  for (let row = 0; row < outHeight; row++) {
    const topY = row * 2;
    const bottomY = row * 2 + 1;
    let ansiLine = '';

    for (let x = 0; x < renderW; x++) {
      const top = frame[topY]![x]!;
      const bottom = bottomY < renderH ? frame[bottomY]![x]! : [0, 0, 0, 0] as const;

      const [tr, tg, tb, ta] = top;
      const [br, bg, bb, ba] = bottom;

      if (ta === 0 && ba === 0) {
        // Both transparent → space
        ansiLine += ' ';
      } else if (ta === 0) {
        // Only bottom visible
        ansiLine += `\x1b[48;2;${br};${bg};${bb}m \x1b[0m`;
      } else if (ba === 0) {
        // Only top visible
        ansiLine += `\x1b[38;2;${tr};${tg};${tb}m▀\x1b[0m`;
      } else if (tr === br && tg === bg && tb === bb) {
        // Same color → full block
        ansiLine += `\x1b[38;2;${tr};${tg};${tb}m█\x1b[0m`;
      } else {
        // Different colors → upper half block
        ansiLine += `\x1b[38;2;${tr};${tg};${tb}m\x1b[48;2;${br};${bg};${bb}m▀\x1b[0m`;
      }
    }

    lines.push(ansiLine);
  }

  return lines;
}

/**
 * Render all frames for a given state.
 * @returns Frame array, each frame is 12 lines of ANSI text.
 */
export function renderAnsiFrames(frames: PixelFrame[]): string[][] {
  return frames.map(renderAnsiFrame);
}
