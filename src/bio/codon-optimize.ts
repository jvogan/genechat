import type { CodonUsage } from './types';
import { STANDARD_CODE, ECOLI_USAGE, HUMAN_USAGE, YEAST_USAGE } from './codon-tables';

/**
 * Pick the most frequent codon for an amino acid in the target organism.
 */
function optimalCodon(aa: string, usage: CodonUsage): string {
  const freqs = usage.frequencies[aa];
  if (!freqs) return 'NNN';
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
 * Codon optimize a DNA sequence for a target organism.
 * Translates the input, then back-translates using optimal codons.
 * @param dnaSeq - Input DNA sequence
 * @param organism - Target organism for optimization
 * @param frame - Reading frame offset (0, 1, 2)
 */
export function codonOptimize(
  dnaSeq: string,
  organism: 'ecoli' | 'human' | 'yeast' = 'ecoli',
  frame: 0 | 1 | 2 = 0,
): string {
  const usage = getUsageTable(organism);
  const upper = dnaSeq.toUpperCase().replace(/U/g, 'T');

  let optimized = '';

  // Preserve any leading bases before the reading frame
  optimized += upper.slice(0, frame);

  for (let i = frame; i + 2 < upper.length; i += 3) {
    const codon = upper.slice(i, i + 3);
    const aa = STANDARD_CODE.codons[codon];
    if (aa === undefined) {
      optimized += codon; // keep unknown codons as-is
    } else if (aa === '*') {
      optimized += codon; // keep stop codons as-is
    } else {
      optimized += optimalCodon(aa, usage);
    }
  }

  // Preserve any trailing bases
  const remainder = (upper.length - frame) % 3;
  if (remainder > 0) {
    optimized += upper.slice(upper.length - remainder);
  }

  return optimized;
}

/**
 * Calculate Codon Adaptation Index (CAI) for a DNA sequence.
 * Returns a value between 0 and 1 (1 = perfectly optimized).
 */
export function calculateCAI(
  dnaSeq: string,
  organism: 'ecoli' | 'human' | 'yeast' = 'ecoli',
  frame: 0 | 1 | 2 = 0,
): number {
  const usage = getUsageTable(organism);
  const upper = dnaSeq.toUpperCase().replace(/U/g, 'T');

  let logSum = 0;
  let codonCount = 0;

  for (let i = frame; i + 2 < upper.length; i += 3) {
    const codon = upper.slice(i, i + 3);
    const aa = STANDARD_CODE.codons[codon];
    if (aa === undefined || aa === '*') continue;

    const freqs = usage.frequencies[aa];
    if (!freqs) continue;

    const maxFreq = Math.max(...Object.values(freqs));
    const codonFreq = freqs[codon] ?? 0;

    if (maxFreq > 0 && codonFreq > 0) {
      logSum += Math.log(codonFreq / maxFreq);
      codonCount++;
    }
  }

  if (codonCount === 0) return 0;
  return Math.exp(logSum / codonCount);
}

function getUsageTable(organism: 'ecoli' | 'human' | 'yeast'): CodonUsage {
  switch (organism) {
    case 'ecoli': return ECOLI_USAGE;
    case 'human': return HUMAN_USAGE;
    case 'yeast': return YEAST_USAGE;
  }
}
