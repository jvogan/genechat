import type { SequenceType } from './types';

const DNA_ONLY = new Set('Tt'.split(''));
const RNA_ONLY = new Set('Uu'.split(''));
const IUPAC_DNA = new Set('ATGCNRYSWKMBDHVatgcnryswkmbdhv'.split(''));
const IUPAC_RNA = new Set('AUGCNRYSWKMBDHVaugcnryswkmbdhv'.split(''));

// Amino acids that are NOT also nucleotide letters
const AA_ONLY = new Set('DEFHIKLMPQRVWdefhiklmpqrvw'.split(''));

// All standard amino acid one-letter codes
const AMINO_ACIDS = new Set('ACDEFGHIKLMNPQRSTVWYacdefghiklmnpqrstvwy*'.split(''));

/**
 * Auto-detect sequence type from raw string.
 * Strips whitespace and digits before analysis.
 */
export function detectSequenceType(raw: string): SequenceType {
  const cleaned = raw.replace(/[\s\d\r\n]/g, '');
  if (cleaned.length === 0) return 'unknown';

  let hasDnaOnly = false;
  let hasRnaOnly = false;
  let hasAaOnly = false;
  let unknownCount = 0;

  for (const ch of cleaned) {
    if (DNA_ONLY.has(ch)) hasDnaOnly = true;
    if (RNA_ONLY.has(ch)) hasRnaOnly = true;
    if (AA_ONLY.has(ch)) hasAaOnly = true;
    if (!AMINO_ACIDS.has(ch) && !IUPAC_DNA.has(ch) && !IUPAC_RNA.has(ch)) {
      unknownCount++;
    }
  }

  // If > 10% unknown characters, it's misc
  if (unknownCount / cleaned.length > 0.1) return 'misc';

  // If contains amino-acid-only letters → protein (or mixed)
  if (hasAaOnly) {
    if (hasDnaOnly || hasRnaOnly) return 'mixed';
    return 'protein';
  }

  // Pure DNA vs RNA
  if (hasDnaOnly && hasRnaOnly) return 'mixed';
  if (hasRnaOnly) return 'rna';
  if (hasDnaOnly) return 'dna';

  // Only A, G, C, N (ambiguous between DNA and RNA) — default to DNA
  const allIupacDna = [...cleaned].every(ch => IUPAC_DNA.has(ch));
  if (allIupacDna) return 'dna';

  return 'unknown';
}
