import type { PixelFrame } from './converter.ts';
import { CONFIG } from '../config.ts';

/**
 * ASCII fallback rendering: convert a PixelFrame to plain text characters.
 *
 * Algorithm:
 * 1. For each character position (26 wide × 12 high), take two vertical pixels.
 * 2. Average their brightness (perceived luminance).
 * 3. Map to 10-level character ramp: ` .:-=+*#%@`
 *
 * @param frame - 26×24 RGBA pixel grid
 * @returns 12 lines of plain text, each 26 characters wide
 */
export function renderAsciiFrame(frame: PixelFrame): string[] {
  const renderW = CONFIG.CODEX_RENDER_WIDTH;
  const renderH = CONFIG.CODEX_RENDER_HEIGHT;
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

      if (ta === 0 && ba === 0) {
        textLine += ' ';
        continue;
      }

      // Perceived luminance weights
      const topLum = ta === 0 ? 0 : 0.299 * top[0] + 0.587 * top[1] + 0.114 * top[2];
      const bottomLum = ba === 0 ? 0 : 0.299 * bottom[0] + 0.587 * bottom[1] + 0.114 * bottom[2];

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
 * Render all frames for a given state as ASCII fallback.
 */
export function renderAsciiFrames(frames: PixelFrame[]): string[][] {
  return frames.map(renderAsciiFrame);
}
