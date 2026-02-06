/**
 * Reverse complement for DNA and RNA sequences.
 * Supports full IUPAC ambiguity codes.
 */

const DNA_COMPLEMENT: Record<string, string> = {
  A: 'T', T: 'A', G: 'C', C: 'G',
  R: 'Y', Y: 'R', S: 'S', W: 'W',
  K: 'M', M: 'K', B: 'V', V: 'B',
  D: 'H', H: 'D', N: 'N',
  a: 't', t: 'a', g: 'c', c: 'g',
  r: 'y', y: 'r', s: 's', w: 'w',
  k: 'm', m: 'k', b: 'v', v: 'b',
  d: 'h', h: 'd', n: 'n',
};

const RNA_COMPLEMENT: Record<string, string> = {
  A: 'U', U: 'A', G: 'C', C: 'G',
  R: 'Y', Y: 'R', S: 'S', W: 'W',
  K: 'M', M: 'K', B: 'V', V: 'B',
  D: 'H', H: 'D', N: 'N',
  a: 'u', u: 'a', g: 'c', c: 'g',
  r: 'y', y: 'r', s: 's', w: 'w',
  k: 'm', m: 'k', b: 'v', v: 'b',
  d: 'h', h: 'd', n: 'n',
};

/** Get complement of a single base */
export function complementBase(base: string, isRna = false): string {
  const table = isRna ? RNA_COMPLEMENT : DNA_COMPLEMENT;
  return table[base] ?? base;
}

/** Get complement of a sequence (without reversing) */
export function complement(seq: string, isRna = false): string {
  const table = isRna ? RNA_COMPLEMENT : DNA_COMPLEMENT;
  let result = '';
  for (const ch of seq) {
    result += table[ch] ?? ch;
  }
  return result;
}

/** Reverse a string */
export function reverseString(s: string): string {
  let result = '';
  for (let i = s.length - 1; i >= 0; i--) {
    result += s[i];
  }
  return result;
}

/** Reverse complement of a DNA or RNA sequence */
export function reverseComplement(seq: string, isRna = false): string {
  return reverseString(complement(seq, isRna));
}
