// ===== Core Bio Types =====
// Shared across all modules. This is the contract.

export type SequenceType = 'dna' | 'rna' | 'protein' | 'misc' | 'unknown' | 'mixed';
export type Topology = 'linear' | 'circular';
export type Strand = 1 | -1;

export type FeatureType =
  | 'orf'
  | 'gene'
  | 'cds'
  | 'promoter'
  | 'terminator'
  | 'rbs'
  | 'origin'
  | 'resistance'
  | 'restriction_site'
  | 'primer_bind'
  | 'misc_feature'
  | 'custom';

export type ManipulationType =
  | 'reverse_complement'
  | 'translate'
  | 'reverse_translate'
  | 'reverse_translate_rna'
  | 'codon_optimize'
  | 'mutate'
  | 'annotate'
  | 'auto_annotate'
  | 'restriction_digest'
  | 'ligate'
  | 'design_primers'
  | 'extract';

export interface Sequence {
  id: string;
  raw: string;
  type: SequenceType;
  topology: Topology;
  length: number;
}

export interface Feature {
  id: string;
  name: string;
  type: FeatureType;
  start: number; // 0-indexed
  end: number;   // exclusive
  strand: Strand;
  color: string;
  metadata: Record<string, unknown>;
}

export interface ORF {
  start: number;
  end: number;
  frame: 1 | 2 | 3;
  strand: Strand;
  length: number;
  aminoAcids: number;
  startCodon: string;
  stopCodon: string;
}

export interface RestrictionSite {
  enzyme: string;
  position: number;
  cutPosition: number;
  recognitionSequence: string;
  overhang: 'blunt' | '5prime' | '3prime';
}

export interface RestrictionEnzyme {
  name: string;
  recognitionSequence: string;
  cutOffset: number;
  complementCutOffset: number;
  overhang: 'blunt' | '5prime' | '3prime';
}

export interface SequenceAnalysis {
  length: number;
  gcContent: number;
  atContent: number;
  molecularWeight: number;
  meltingTemp: number | null;
  orfs: ORF[];
  restrictionSites: RestrictionSite[];
  composition: NucleotideComposition;
}

export interface NucleotideComposition {
  A: number;
  T: number;
  G: number;
  C: number;
  N: number;
  other: number;
}

export interface CodonTable {
  id: number;
  name: string;
  codons: Record<string, string>; // codon → amino acid
  starts: string[];
  stops: string[];
}

export interface CodonUsage {
  organism: string;
  frequencies: Record<string, Record<string, number>>; // amino acid → codon → frequency
}

export interface FastaRecord {
  header: string;
  description: string;
  sequence: string;
}

// Base color map
export const BASE_COLORS: Record<string, string> = {
  A: '#4ade80', // green
  T: '#f87171', // red
  U: '#f87171', // red (RNA)
  G: '#facc15', // yellow
  C: '#60a5fa', // blue
  N: '#6b7280', // gray
};

// Amino acid color map (Taylor scheme)
export const AA_COLORS: Record<string, string> = {
  A: '#ccff00', C: '#ffff00', D: '#ff0000', E: '#ff0066',
  F: '#00ff66', G: '#ff9900', H: '#0066ff', I: '#66ff00',
  K: '#6600ff', L: '#33ff00', M: '#00ff00', N: '#cc00ff',
  P: '#ffcc00', Q: '#ff00cc', R: '#0000ff', S: '#ff3300',
  T: '#ff6600', V: '#99ff00', W: '#00ccff', Y: '#00ffcc',
  '*': '#888888', // stop
};
