/**
 * Terminal capability detection for rendering decisions.
 */

/**
 * Check if the terminal supports true color (24-bit).
 *
 * Detection strategy:
 * - COLORTERM = 'truecolor' or '24bit'
 * - NO_COLOR not set
 * - Not a known old terminal (TERM != 'xterm', 'xterm-256color', etc.)
 */
export function supportsTrueColor(): boolean {
  // If NO_COLOR is set, never use ANSI color
  if (process.env.NO_COLOR !== undefined) {
    return false;
  }

  const colorterm = process.env.COLORTERM ?? '';
  if (colorterm === 'truecolor' || colorterm === '24bit') {
    return true;
  }

  const term = process.env.TERM ?? '';
  if (term === 'xterm-256color' || term === 'xterm' || term === 'xterm-kitty') {
    return true;
  }

  // Default to false for safety
  return false;
}
