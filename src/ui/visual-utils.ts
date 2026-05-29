/**
 * Visual-width utilities for ANSI-aware terminal rendering.
 *
 * Treats CJK / wide characters (including U+2728 ✨) as width 2,
 * strips ANSI escape sequences for counting, and provides safe
 * truncation that preserves ANSI codes and ensures a reset trailer.
 *
 * Surrogate pairs (BMP-exceeding emoji / CJK extensions) are handled
 * correctly — each code point is counted once, not per UTF-16 unit.
 *
 * No regex uses the 'g' flag — .test() on a global regex mutates
 * lastIndex, causing off-by-one / intermittent failures.
 */


/** Ranges of Unicode code-points that occupy 2 columns in a terminal. */
function isWideCode(code: number): boolean {
  return (
    (code >= 0x1100 && code <= 0x11FF) ||  // Hangul Jamo
    (code >= 0x2E80 && code <= 0x303E) ||  // CJK Radicals / Kangxi / CJK Symbols
    (code >= 0x3040 && code <= 0x309F) ||  // Hiragana
    (code >= 0x30A0 && code <= 0x30FF) ||  // Katakana
    (code >= 0x3130 && code <= 0x318F) ||  // Hangul Compatibility Jamo
    (code >= 0x31F0 && code <= 0x31FF) ||  // Katakana Phonetic Extensions
    (code >= 0x3400 && code <= 0x4DBF) ||  // CJK Unified Ideographs Extension A
    (code >= 0x4E00 && code <= 0x9FFF) ||  // CJK Unified Ideographs
    (code >= 0xA000 && code <= 0xA4CF) ||  // Yi
    (code >= 0xAC00 && code <= 0xD7AF) ||  // Hangul Syllables
    (code >= 0xF900 && code <= 0xFAFF) ||  // CJK Compatibility Ideographs
    (code >= 0xFE30 && code <= 0xFE4F) ||  // CJK Compatibility Forms
    (code >= 0xFF01 && code <= 0xFF60) ||  // Fullwidth Forms
    (code >= 0xFFE0 && code <= 0xFFE6) ||  // Fullwidth Signs
    (code >= 0x2600 && code <= 0x27BF) ||  // Misc Symbols (U+2728 ✨, etc.)
    (code >= 0x1F000 && code <= 0x1FFFF) || // Emoji / Supplemental
    (code >= 0x20000 && code <= 0x2FFFF) || // CJK Extension B / C / D / E / F
    (code >= 0x30000 && code <= 0x3FFFF)    // CJK Extension G / H
  );
}

/**
 * Count the visual display width of a string.
 * ANSI escapes are invisible; CJK / wide chars count as 2.
 */
export function visualLen(s: string): number {
  let len = 0;
  let i = 0;
  while (i < s.length) {
    if (s[i] === '\x1b' && s[i + 1] === '[') {
      // Skip ANSI escape: \x1b[...m
      i += 2;
      while (i < s.length && s[i] !== 'm') i++;
      if (i < s.length) i++; // skip 'm'
      continue;
    }
    const cp = s.codePointAt(i)!;
    len += isWideCode(cp) ? 2 : 1;
    // Advance past surrogate pair (2 UTF-16 units) or single unit
    i += cp > 0xFFFF ? 2 : 1;
  }
  return len;
}

/**
 * Right-align `s` in a field of visual width `w` by padding with `ch`.
 */
export function visualPadStart(s: string, w: number, ch = ' '): string {
  const d = w - visualLen(s);
  return d > 0 ? ch.repeat(d) + s : s;
}

/**
 * Left-align (pad-end) `s` to visual width `w`.
 */
export function visualPadEnd(s: string, w: number, ch = ' '): string {
  const d = w - visualLen(s);
  return d > 0 ? s + ch.repeat(d) : s;
}

/**
 * Wrap `text` across multiple lines, each fitting within `maxWidth` visual columns.
 * Respects ANSI escape sequences and ensures the final line has a reset trailer.
 * Continuation indentation is not added — callers format prefixes independently.
 *
 * NOTE: returns an empty array `[]` when maxWidth is too small to hold any character
 * (e.g. maxWidth===1 and the first character is a wide emoji needing 2 columns),
 * or when maxWidth <= 0. Callers should handle `[]` gracefully (e.g. show placeholder).
 */
export function visualWrap(text: string, maxWidth: number): string[] {
  if (maxWidth <= 0) return [];
  if (text.length > 0 && maxWidth >= 1) {
    // Check if the first character is too wide to fit
    const firstCp = text.codePointAt(0)!;
    if (isWideCode(firstCp) && maxWidth < 2) {
      return ['\u2026']; // ellipsis placeholder
    }
  }
  const lines: string[] = [];
  let pos = 0;

  while (pos < text.length) {
    let visual = 0;
    let i = pos;

    while (i < text.length && visual < maxWidth) {
      if (text[i] === '\x1b' && text[i + 1] === '[') {
        // Skip ANSI escape sequence verbatim
        i += 2;
        while (i < text.length && text[i] !== 'm') i++;
        if (i < text.length) i++;
        continue;
      }
      const cp = text.codePointAt(i)!;
      const w = isWideCode(cp) ? 2 : 1;
      const unitLen = cp > 0xFFFF ? 2 : 1;
      if (visual + w > maxWidth) break;
      visual += w;
      i += unitLen;
    }

    const chunk = text.slice(pos, i);
    if (chunk.length === 0) break; // safety: no progress
    lines.push(chunk);
    pos = i;
  }

  // Ensure the last line carries a reset to prevent color leakage
  if (lines.length > 0 && !lines[lines.length - 1].endsWith('\x1b[0m')) {
    lines[lines.length - 1] += '\x1b[0m';
  }

  return lines;
}
/**
 * Truncate `s` to at most `maxLen` visual columns, preserving ANSI
 * escape sequences and appending a reset (\x1b[0m) to prevent color
 * leakage past the truncation point.
 *
 * Surrogate pairs are preserved fully — if a code point would be
 * split, it is included completely and the loop stops.
 */
export function visualClamp(s: string, maxLen: number): string {
  if (visualLen(s) <= maxLen) return s;
  let result = '';
  let visual = 0;
  let i = 0;
  while (i < s.length && visual < maxLen) {
    if (s[i] === '\x1b' && s[i + 1] === '[') {
      // Preserve ANSI sequence verbatim
      const start = i;
      i += 2;
      while (i < s.length && s[i] !== 'm') i++;
      if (i < s.length) i++; // skip 'm'
      result += s.slice(start, i);
      continue;
    }
    const cp = s.codePointAt(i)!;
    const w = isWideCode(cp) ? 2 : 1;
    const unitLen = cp > 0xFFFF ? 2 : 1;
    // Would overflow — stop here (don't include partial surrogate pair)
    if (visual + w > maxLen) break;
    result += s.slice(i, i + unitLen);
    visual += w;
    i += unitLen;
  }
  // Append reset to prevent color leakage
  if (!result.endsWith('\x1b[0m')) {
    result += '\x1b[0m';
  }
  return result;
}
