import type { CodonTable } from './types';
import { STANDARD_CODE } from './codon-tables';

/**
 * Convert RNA to DNA (U → T) for codon lookup.
 */
function rnaToDay(seq: string): string {
  return seq.replace(/[Uu]/g, m => m === 'U' ? 'T' : 't');
}

/**
 * Translate a DNA or RNA sequence to a protein string.
 * @param seq - DNA or RNA sequence
 * @param frame - Reading frame offset (0, 1, or 2)
 * @param table - Codon table to use (defaults to standard)
 * @param stopAtFirst - Stop at the first stop codon
 */
export function translate(
  seq: string,
  frame: 0 | 1 | 2 = 0,
  table: CodonTable = STANDARD_CODE,
  stopAtFirst = false,
): string {
  const dna = rnaToDay(seq.toUpperCase());
  let protein = '';

  for (let i = frame; i + 2 < dna.length; i += 3) {
    const codon = dna.slice(i, i + 3);
    const aa = table.codons[codon];
    if (aa === undefined) {
      protein += 'X'; // unknown codon
    } else if (aa === '*' && stopAtFirst) {
      protein += '*';
      break;
    } else {
      protein += aa;
    }
  }

  return protein;
}

/**
 * Translate in all 3 reading frames.
 */
export function translateAllFrames(
  seq: string,
  table: CodonTable = STANDARD_CODE,
): [string, string, string] {
  return [
    translate(seq, 0, table),
    translate(seq, 1, table),
    translate(seq, 2, table),
  ];
}

/**
 * Translate starting from the first ATG (or AUG).
 */
export function translateFromFirstATG(
  seq: string,
  table: CodonTable = STANDARD_CODE,
): string | null {
  const dna = rnaToDay(seq.toUpperCase());
  const atgIndex = dna.indexOf('ATG');
  if (atgIndex === -1) return null;
  return translate(dna.slice(atgIndex), 0, table, true);
}
