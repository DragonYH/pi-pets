import sharp from 'sharp';

import { CONFIG } from '../config.js';

import type { AnimationState } from '../types.js';
const { ALPHA_OPAQUE_THRESHOLD, MIN_OPAQUE_RATIO } = CONFIG;
/**
 * RGBA pixel: [r, g, b, a]
 */
export type RGBAPixel = [number, number, number, number];

/**
 * A frame is a 2D grid of RGBA pixels (renderHeight × renderWidth).
 */
export type PixelFrame = RGBAPixel[][];

/**
 * Result of converting a spritesheet: a map of animation state → frames
 * (blank/transparent frames are automatically filtered out).
 */
export type ConversionResult = Record<string, PixelFrame[]>;

/** Animation state names in the order they appear in the spritesheet (9 rows). */
const SPRITESHEET_STATES: AnimationState[] = [
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
 * Check whether a pixel frame is effectively blank (fully or nearly transparent).
 * A frame is considered blank when fewer than MIN_OPAQUE_RATIO of its pixels
 * have alpha > ALPHA_OPAQUE_THRESHOLD.
 */
function isFrameBlank(frame: PixelFrame): boolean {
  const renderH = frame.length;
  if (renderH === 0) return true;
  const renderW = frame[0]!.length;
  if (renderW === 0) return true;

  const totalPixels = renderH * renderW;
  const minOpaque = Math.max(1, Math.ceil(totalPixels * MIN_OPAQUE_RATIO));
  let opaqueCount = 0;

  for (let y = 0; y < renderH; y++) {
    const row = frame[y]!;
    for (let x = 0; x < renderW; x++) {
      if (row[x]![3]! > ALPHA_OPAQUE_THRESHOLD) {
        opaqueCount++;
        if (opaqueCount >= minOpaque) return false; // early exit
      }
    }
  }

  return true;
}

/**
 * Load a spritesheet.webp and convert each frame to a pixel grid.
 *
 * Spritesheet layout: 8 columns × 9 rows, each frame 192×208px.
 * All columns are read in order; each column is one frame.
 * Fully transparent / blank frames are automatically filtered out.
 * Each frame is downsampled to FRAME_WIDTH × FRAME_HEIGHT.
 *
 * @param webpPath - Path to the spritesheet.webp file
 * @returns A map of animation state name → PixelFrame arrays (blank frames removed)
 */
export async function convertSpritesheet(webpPath: string): Promise<ConversionResult> {
  const image = sharp(webpPath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Unable to read spritesheet dimensions: ${webpPath}`);
  }

  const frameW = CONFIG.FRAME_WIDTH;
  const frameH = CONFIG.FRAME_HEIGHT;
  const cols = CONFIG.SPRITESHEET_COLS;
  const rows = CONFIG.SPRITESHEET_ROWS;
  const renderW = CONFIG.RENDER_WIDTH;
  const renderH = CONFIG.RENDER_HEIGHT;

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

    // Process every column in order as a frame
    for (let col = 0; col < cols; col++) {
      const left = col * frameW;
      const top = row * frameH;

      const { data } = await sharp(webpPath)
        .extract({ left, top, width: frameW, height: frameH })
        .resize(renderW, renderH, { fit: 'fill', kernel: 'nearest' })
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

      // Skip blank (fully transparent) frames
      if (!isFrameBlank(grid)) {
        frames.push(grid);
      }
    }

    result[stateName] = frames;
  }

  return result;
}
