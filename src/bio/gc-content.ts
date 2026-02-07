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
// Average molecular weights (Da) for amino acids
const AA_MW: Record<string, number> = {
  G: 57.02, A: 71.04, V: 99.07, L: 113.08, I: 113.08,
  P: 97.05, F: 147.07, W: 186.08, M: 131.04, S: 87.03,
  T: 101.05, C: 103.01, Y: 163.06, H: 137.06, D: 115.03,
  E: 129.04, N: 114.04, Q: 128.06, K: 128.09, R: 156.10,
};
const AVG_AA_MW = 111.1; // fallback average

/**
 * Estimate molecular weight of a protein sequence.
 * Sums residue weights and subtracts water lost to peptide bonds.
 */
export function proteinMolecularWeight(seq: string): number {
  const upper = seq.toUpperCase().replace(/\*/g, ''); // strip stop codons
  if (upper.length === 0) return 0;
  let mw = 18.02; // add water for the intact protein (N-term H + C-term OH)
  for (const ch of upper) {
    mw += AA_MW[ch] ?? AVG_AA_MW;
  }
  return Math.round(mw * 100) / 100;
}

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
