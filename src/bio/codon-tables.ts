import type { CodonTable, CodonUsage } from './types';

/** Standard genetic code (NCBI translation table 1) */
export const STANDARD_CODE: CodonTable = {
  id: 1,
  name: 'Standard',
  codons: {
    TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
    CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
    ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
    GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
    TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
    CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
    ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
    GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
    TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
    CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
    AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
    GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
    TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
    CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
    AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
    GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
  },
  starts: ['ATG', 'CTG', 'TTG'],
  stops: ['TAA', 'TAG', 'TGA'],
};

/** Build reverse map: amino acid → list of codons */
export function getAminoAcidToCodons(table: CodonTable = STANDARD_CODE): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const [codon, aa] of Object.entries(table.codons)) {
    if (!map[aa]) map[aa] = [];
    map[aa].push(codon);
  }
  return map;
}

// Codon usage frequencies (fractions per amino acid, approximate)
// Source: Kazusa codon usage database

export const ECOLI_USAGE: CodonUsage = {
  organism: 'E. coli K12',
  frequencies: {
    F: { TTT: 0.58, TTC: 0.42 },
    L: { TTA: 0.11, TTG: 0.11, CTT: 0.10, CTC: 0.10, CTA: 0.04, CTG: 0.54 },
    I: { ATT: 0.49, ATC: 0.39, ATA: 0.07 },
    M: { ATG: 1.0 },
    V: { GTT: 0.28, GTC: 0.20, GTA: 0.17, GTG: 0.35 },
    S: { TCT: 0.17, TCC: 0.15, TCA: 0.12, TCG: 0.15, AGT: 0.16, AGC: 0.25 },
    P: { CCT: 0.18, CCC: 0.13, CCA: 0.20, CCG: 0.49 },
    T: { ACT: 0.19, ACC: 0.40, ACA: 0.13, ACG: 0.25 },
    A: { GCT: 0.18, GCC: 0.26, GCA: 0.21, GCG: 0.35 },
    Y: { TAT: 0.59, TAC: 0.41 },
    '*': { TAA: 0.61, TAG: 0.09, TGA: 0.30 },
    H: { CAT: 0.57, CAC: 0.43 },
    Q: { CAA: 0.34, CAG: 0.66 },
    N: { AAT: 0.49, AAC: 0.51 },
    K: { AAA: 0.74, AAG: 0.26 },
    D: { GAT: 0.63, GAC: 0.37 },
    E: { GAA: 0.68, GAG: 0.32 },
    C: { TGT: 0.46, TGC: 0.54 },
    W: { TGG: 1.0 },
    R: { CGT: 0.36, CGC: 0.36, CGA: 0.07, CGG: 0.11, AGA: 0.07, AGG: 0.04 },
    G: { GGT: 0.35, GGC: 0.37, GGA: 0.13, GGG: 0.15 },
  },
};

export const HUMAN_USAGE: CodonUsage = {
  organism: 'Homo sapiens',
  frequencies: {
    F: { TTT: 0.45, TTC: 0.55 },
    L: { TTA: 0.07, TTG: 0.13, CTT: 0.13, CTC: 0.20, CTA: 0.07, CTG: 0.40 },
    I: { ATT: 0.36, ATC: 0.48, ATA: 0.16 },
    M: { ATG: 1.0 },
    V: { GTT: 0.18, GTC: 0.24, GTA: 0.12, GTG: 0.46 },
    S: { TCT: 0.18, TCC: 0.22, TCA: 0.15, TCG: 0.06, AGT: 0.15, AGC: 0.24 },
    P: { CCT: 0.29, CCC: 0.33, CCA: 0.27, CCG: 0.11 },
    T: { ACT: 0.24, ACC: 0.36, ACA: 0.28, ACG: 0.12 },
    A: { GCT: 0.26, GCC: 0.40, GCA: 0.23, GCG: 0.11 },
    Y: { TAT: 0.43, TAC: 0.57 },
    '*': { TAA: 0.28, TAG: 0.20, TGA: 0.52 },
    H: { CAT: 0.41, CAC: 0.59 },
    Q: { CAA: 0.25, CAG: 0.75 },
    N: { AAT: 0.46, AAC: 0.54 },
    K: { AAA: 0.42, AAG: 0.58 },
    D: { GAT: 0.46, GAC: 0.54 },
    E: { GAA: 0.42, GAG: 0.58 },
    C: { TGT: 0.45, TGC: 0.55 },
    W: { TGG: 1.0 },
    R: { CGT: 0.08, CGC: 0.19, CGA: 0.11, CGG: 0.21, AGA: 0.20, AGG: 0.21 },
    G: { GGT: 0.16, GGC: 0.34, GGA: 0.25, GGG: 0.25 },
  },
};

export const YEAST_USAGE: CodonUsage = {
  organism: 'Saccharomyces cerevisiae',
  frequencies: {
    F: { TTT: 0.59, TTC: 0.41 },
    L: { TTA: 0.28, TTG: 0.29, CTT: 0.13, CTC: 0.06, CTA: 0.14, CTG: 0.10 },
    I: { ATT: 0.46, ATC: 0.26, ATA: 0.27 },
    M: { ATG: 1.0 },
    V: { GTT: 0.39, GTC: 0.21, GTA: 0.21, GTG: 0.19 },
    S: { TCT: 0.26, TCC: 0.16, TCA: 0.21, TCG: 0.10, AGT: 0.16, AGC: 0.11 },
    P: { CCT: 0.31, CCC: 0.15, CCA: 0.42, CCG: 0.12 },
    T: { ACT: 0.35, ACC: 0.22, ACA: 0.30, ACG: 0.13 },
    A: { GCT: 0.38, GCC: 0.22, GCA: 0.29, GCG: 0.11 },
    Y: { TAT: 0.56, TAC: 0.44 },
    '*': { TAA: 0.47, TAG: 0.23, TGA: 0.30 },
    H: { CAT: 0.64, CAC: 0.36 },
    Q: { CAA: 0.69, CAG: 0.31 },
    N: { AAT: 0.59, AAC: 0.41 },
    K: { AAA: 0.58, AAG: 0.42 },
    D: { GAT: 0.65, GAC: 0.35 },
    E: { GAA: 0.70, GAG: 0.30 },
    C: { TGT: 0.63, TGC: 0.37 },
    W: { TGG: 1.0 },
    R: { CGT: 0.15, CGC: 0.06, CGA: 0.07, CGG: 0.04, AGA: 0.48, AGG: 0.21 },
    G: { GGT: 0.47, GGC: 0.19, GGA: 0.22, GGG: 0.12 },
  },
};

/** Get usage table by organism name */
export function getCodonUsage(organism: 'ecoli' | 'human' | 'yeast'): CodonUsage {
  switch (organism) {
    case 'ecoli': return ECOLI_USAGE;
    case 'human': return HUMAN_USAGE;
    case 'yeast': return YEAST_USAGE;
  }
}
