import type { CodonUsage } from './types';
import { ECOLI_USAGE } from './codon-tables';

/**
 * Pick the most frequent codon for a given amino acid.
 */
function bestCodon(aa: string, usage: CodonUsage): string {
  const freqs = usage.frequencies[aa];
  if (!freqs) return 'NNN'; // unknown amino acid
  let best = '';
  let bestFreq = -1;
  for (const [codon, freq] of Object.entries(freqs)) {
    if (freq > bestFreq) {
      bestFreq = freq;
      best = codon;
    }
  }
  return best;
}

/**
 * Reverse translate a protein sequence to DNA using codon usage frequencies.
 * Uses the most frequent codon for each amino acid.
 * @param protein - Amino acid sequence (one-letter codes)
 * @param usage - Codon usage table (defaults to E. coli)
 */
export function reverseTranslate(
  protein: string,
  usage: CodonUsage = ECOLI_USAGE,
): string {
  const upper = protein.toUpperCase();
  let dna = '';
  for (const aa of upper) {
    if (aa === '*') break; // stop
    dna += bestCodon(aa, usage);
  }
  return dna;
}

/**
 * Reverse translate with all possible codons for each position.
 * Returns array of arrays (one array of possible codons per amino acid).
 */
export function reverseTranslateAll(
  protein: string,
  usage: CodonUsage = ECOLI_USAGE,
): string[][] {
  const upper = protein.toUpperCase();
  const result: string[][] = [];
  for (const aa of upper) {
    if (aa === '*') break;
    const freqs = usage.frequencies[aa];
    if (freqs) {
      // Sort by frequency descending
      const codons = Object.entries(freqs)
        .sort((a, b) => b[1] - a[1])
        .map(([codon]) => codon);
      result.push(codons);
    } else {
      result.push(['NNN']);
    }
  }
  return result;
}
