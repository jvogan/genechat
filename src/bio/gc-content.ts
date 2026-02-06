import type { NucleotideComposition } from './types';

/**
 * Count nucleotide composition of a DNA/RNA sequence.
 */
export function nucleotideComposition(seq: string): NucleotideComposition {
  const comp: NucleotideComposition = { A: 0, T: 0, G: 0, C: 0, N: 0, other: 0 };
  const upper = seq.toUpperCase();

  for (const ch of upper) {
    switch (ch) {
      case 'A': comp.A++; break;
      case 'T': case 'U': comp.T++; break;
      case 'G': comp.G++; break;
      case 'C': comp.C++; break;
      case 'N': comp.N++; break;
      default: comp.other++; break;
    }
  }

  return comp;
}

/**
 * Calculate GC content as a fraction (0-1).
 */
export function gcContent(seq: string): number {
  const comp = nucleotideComposition(seq);
  const total = comp.A + comp.T + comp.G + comp.C;
  if (total === 0) return 0;
  return (comp.G + comp.C) / total;
}

/**
 * Calculate AT content as a fraction (0-1).
 */
export function atContent(seq: string): number {
  return 1 - gcContent(seq);
}

/**
 * Calculate GC content in a sliding window.
 * @param seq - DNA sequence
 * @param windowSize - Window size in bases (default 100)
 * @param step - Step size (default 1)
 * @returns Array of { position, gc } objects
 */
export function gcContentWindow(
  seq: string,
  windowSize = 100,
  step = 1,
): Array<{ position: number; gc: number }> {
  const results: Array<{ position: number; gc: number }> = [];
  const upper = seq.toUpperCase();

  if (upper.length < windowSize) {
    return [{ position: 0, gc: gcContent(upper) }];
  }

  for (let i = 0; i <= upper.length - windowSize; i += step) {
    const window = upper.slice(i, i + windowSize);
    results.push({ position: i, gc: gcContent(window) });
  }

  return results;
}

// Average molecular weights (Da) for nucleotides (internal, no terminal groups)
const DNA_MW: Record<string, number> = {
  A: 313.21, T: 304.19, G: 329.21, C: 289.18, N: 308.95,
};

/**
 * Estimate molecular weight of a single-stranded DNA sequence.
 * Uses average internal nucleotide weights.
 */
export function molecularWeight(seq: string): number {
  const upper = seq.toUpperCase().replace(/U/g, 'T');
  let mw = 0;

  for (const ch of upper) {
    mw += DNA_MW[ch] ?? DNA_MW.N;
  }

  // Subtract water for phosphodiester bonds and add terminal groups
  // Simplified: mw - (n-1)*18.02 + 17.01 + 79.0 (5' phosphate, 3' OH)
  if (upper.length > 0) {
    mw -= (upper.length - 1) * 18.02;
    mw += 17.01 + 79.0;
  }

  return Math.round(mw * 100) / 100;
}

/**
 * Estimate melting temperature (Tm) of a DNA oligo.
 * - For sequences <= 13 bp: Wallace rule Tm = 2*(A+T) + 4*(G+C)
 * - For longer sequences: basic salt-adjusted formula
 *   Tm = 64.9 + 41*(G+C - 16.4) / (A+T+G+C)
 */
export function meltingTemperature(seq: string): number | null {
  const comp = nucleotideComposition(seq);
  const total = comp.A + comp.T + comp.G + comp.C;
  if (total === 0) return null;

  if (total <= 13) {
    // Wallace rule (short oligos)
    return 2 * (comp.A + comp.T) + 4 * (comp.G + comp.C);
  }

  // Basic Tm formula for longer oligos
  return 64.9 + 41 * (comp.G + comp.C - 16.4) / total;
}
