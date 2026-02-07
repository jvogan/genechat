/**
 * IUPAC-aware motif search for DNA/RNA/protein sequences.
 */

export interface MotifMatch {
  start: number;
  end: number;    // exclusive
  matched: string; // actual matched substring
}

/** IUPAC ambiguity codes → regex character class */
const IUPAC_MAP: Record<string, string> = {
  A: 'A', C: 'C', G: 'G', T: 'T', U: 'U',
  R: '[AG]', Y: '[CT]', S: '[GC]', W: '[AT]',
  K: '[GT]', M: '[AC]', B: '[CGT]', D: '[AGT]',
  H: '[ACT]', V: '[ACG]', N: '[ACGTU]',
};

/**
 * Convert an IUPAC pattern to a regex.
 * Non-IUPAC characters are passed through literally (supports protein patterns too).
 */
function patternToRegex(pattern: string): RegExp | null {
  if (!pattern) return null;
  let regexStr = '';
  for (const ch of pattern.toUpperCase()) {
    regexStr += IUPAC_MAP[ch] ?? ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  try {
    return new RegExp(`(?=(${regexStr}))`, 'gi');
  } catch {
    return null;
  }
}

/**
 * Find all matches of a motif pattern in a sequence.
 * Uses lookahead for overlapping matches and advances lastIndex to prevent infinite loops.
 */
export function findMotif(seq: string, pattern: string): MotifMatch[] {
  if (!seq || !pattern) return [];
  const regex = patternToRegex(pattern);
  if (!regex) return [];

  const upper = seq.toUpperCase();
  const matches: MotifMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(upper)) !== null) {
    const captured = match[1];
    matches.push({
      start: match.index,
      end: match.index + captured.length,
      matched: captured,
    });
    // Advance lastIndex to prevent infinite loop (lookahead = zero-length match)
    regex.lastIndex = match.index + 1;
  }

  return matches;
}
