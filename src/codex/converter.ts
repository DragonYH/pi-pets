import sharp from 'sharp';
import { CONFIG } from '../config.ts';
import type { CodexAnimationState } from '../types.ts';

/**
 * RGBA pixel: [r, g, b, a]
 */
export type RGBAPixel = [number, number, number, number];

/**
 * A frame is a 2D grid of RGBA pixels (renderHeight × renderWidth).
 */
export type PixelFrame = RGBAPixel[][];

/**
 * Result of converting a spritesheet: a map of animation state → 4 frames.
 */
export type ConversionResult = Record<string, PixelFrame[]>;

/** Animation state names in the order they appear in the spritesheet (9 rows). */
const SPRITESHEET_STATES: CodexAnimationState[] = [
  'idle',
  'run',
  'sleep',
  'eat',
  'attack',
  'hurt',
  'jump',
  'play',
  'failed',
];

/**
 * Load a Codex spritesheet.webp and convert each frame to a pixel grid.
 *
 * Spritesheet layout: 8 columns × 9 rows, each frame 192×208px.
 * We take even columns (0,2,4,6) → 4 frames per state.
 * Each frame is downsampled to CODEX_RENDER_WIDTH × CODEX_RENDER_HEIGHT.
 *
 * @param webpPath - Path to the spritesheet.webp file
 * @returns A map of animation state name → 4 PixelFrame arrays
 */
export async function convertSpritesheet(webpPath: string): Promise<ConversionResult> {
  const image = sharp(webpPath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Unable to read spritesheet dimensions: ${webpPath}`);
  }

  const frameW = CONFIG.CODEX_FRAME_WIDTH;
  const frameH = CONFIG.CODEX_FRAME_HEIGHT;
  const cols = CONFIG.CODEX_SPRITESHEET_COLS;
  const rows = CONFIG.CODEX_SPRITESHEET_ROWS;
  const renderW = CONFIG.CODEX_RENDER_WIDTH;
  const renderH = CONFIG.CODEX_RENDER_HEIGHT;

  if (metadata.width < cols * frameW || metadata.height < rows * frameH) {
    throw new Error(
      `Spritesheet too small: expected at least ${cols * frameW}×${rows * frameH}, got ${metadata.width}×${metadata.height}`,
    );
  }

  const result: ConversionResult = {};

  for (let row = 0; row < rows; row++) {
    const stateName = SPRITESHEET_STATES[row];
    if (!stateName) continue;

    const frames: PixelFrame[] = [];

    // Take even columns: 0, 2, 4, 6
    for (let col = 0; col < cols; col += 2) {
      const left = col * frameW;
      const top = row * frameH;

      const { data } = await sharp(webpPath)
        .extract({ left, top, width: frameW, height: frameH })
        .resize(renderW, renderH, { fit: 'fill' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Convert flat RGBA buffer into 2D pixel grid
      const grid: RGBAPixel[][] = [];
      for (let y = 0; y < renderH; y++) {
        const rowPixels: RGBAPixel[] = [];
        for (let x = 0; x < renderW; x++) {
          const idx = (y * renderW + x) * 4;
          rowPixels.push([data[idx]!, data[idx + 1]!, data[idx + 2]!, data[idx + 3]!]);
        }
        grid.push(rowPixels);
      }

      frames.push(grid);
    }

    result[stateName] = frames;
  }

  return result;
}
