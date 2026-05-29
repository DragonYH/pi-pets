import type { PixelFrame } from './converter.ts';
import { CONFIG } from '../config.ts';

const { ALPHA_OPAQUE_THRESHOLD } = CONFIG;

/**
 * Render a PixelFrame as an array of ANSI-encoded strings (12 lines).
 *
 * Algorithm: two vertical pixels form one character cell using Unicode half-blocks.
 *   - Both pixels the same color → '█' with that color as foreground.
 *   - Different colors → '▀' (upper half) with top pixel as foreground, bottom as background.
 *
 * Each line is padded to renderWidth characters and ends with \x1b[0m.
 *
 * @param frame - pixel grid
 * @returns ANSI strings
 */
export function renderAnsiFrame(frame: PixelFrame): string[] {
  const renderW = CONFIG.RENDER_WIDTH;
  const renderH = CONFIG.RENDER_HEIGHT;
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

      if (ta <= ALPHA_OPAQUE_THRESHOLD && ba <= ALPHA_OPAQUE_THRESHOLD) {
        // Both transparent → space
        ansiLine += ' ';
      } else if (ta <= ALPHA_OPAQUE_THRESHOLD) {
        // Only bottom visible
        ansiLine += `\x1b[48;2;${br};${bg};${bb}m \x1b[0m`;
      } else if (ba <= ALPHA_OPAQUE_THRESHOLD) {
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
 * @returns Frame array, each frame is lines of ANSI text.
 */
export function renderAnsiFrames(frames: PixelFrame[]): string[][] {
  return frames.map(renderAnsiFrame);
}

/**
 * Text fallback rendering: convert a PixelFrame to plain text characters.
 *
 * Algorithm:
 * 1. For each character position, take two vertical pixels.
 * 2. Average their brightness (perceived luminance).
 * 3. Map to 10-level character ramp: ` .:-=+*#%@`
 *
 * @param frame - pixel grid
 * @returns lines of plain text
 */
export function renderTextFrame(frame: PixelFrame): string[] {
  const renderW = CONFIG.RENDER_WIDTH;
  const renderH = CONFIG.RENDER_HEIGHT;
  const outHeight = renderH / 2;

  const ramp = ' .:-=+*#%@';

  const lines: string[] = [];

  for (let row = 0; row < outHeight; row++) {
    const topY = row * 2;
    const bottomY = row * 2 + 1;
    let textLine = '';

    for (let x = 0; x < renderW; x++) {
      const top = frame[topY]![x]!;
      const bottom = bottomY < renderH ? frame[bottomY]![x]! : [0, 0, 0, 0] as const;

      const [, , , ta] = top;
      const [, , , ba] = bottom;

      if (ta <= ALPHA_OPAQUE_THRESHOLD && ba <= ALPHA_OPAQUE_THRESHOLD) {
        textLine += ' ';
        continue;
      }

      // Perceived luminance weights
      const topLum = ta <= ALPHA_OPAQUE_THRESHOLD ? 0 : 0.299 * top[0] + 0.587 * top[1] + 0.114 * top[2];
      const bottomLum = ba <= ALPHA_OPAQUE_THRESHOLD ? 0 : 0.299 * bottom[0] + 0.587 * bottom[1] + 0.114 * bottom[2];

      // Average luminance of the two pixels
      const avgLum = (topLum + bottomLum) / 2;
      const index = Math.min(Math.floor((avgLum / 255) * ramp.length), ramp.length - 1);

      textLine += ramp[index] ?? ' ';
    }

    lines.push(textLine);
  }

  return lines;
}

/**
 * Render all frames for a given state as text fallback.
 */
export function renderTextFrames(frames: PixelFrame[]): string[][] {
  return frames.map(renderTextFrame);
}
