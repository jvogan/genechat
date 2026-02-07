import type { RestrictionEnzyme, RestrictionSite } from './types';

/** Database of common restriction enzymes (>20) */
export const RESTRICTION_ENZYMES: RestrictionEnzyme[] = [
  { name: 'EcoRI',  recognitionSequence: 'GAATTC',   cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'BamHI',  recognitionSequence: 'GGATCC',   cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'HindIII', recognitionSequence: 'AAGCTT',  cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'XbaI',   recognitionSequence: 'TCTAGA',   cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'SalI',   recognitionSequence: 'GTCGAC',   cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'PstI',   recognitionSequence: 'CTGCAG',   cutOffset: 5, complementCutOffset: 1, overhang: '3prime' },
  { name: 'NotI',   recognitionSequence: 'GCGGCCGC', cutOffset: 2, complementCutOffset: 6, overhang: '5prime' },
  { name: 'XhoI',   recognitionSequence: 'CTCGAG',   cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'NcoI',   recognitionSequence: 'CCATGG',   cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'NdeI',   recognitionSequence: 'CATATG',   cutOffset: 2, complementCutOffset: 4, overhang: '5prime' },
  { name: 'SpeI',   recognitionSequence: 'ACTAGT',   cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'KpnI',   recognitionSequence: 'GGTACC',   cutOffset: 5, complementCutOffset: 1, overhang: '3prime' },
  { name: 'SacI',   recognitionSequence: 'GAGCTC',   cutOffset: 5, complementCutOffset: 1, overhang: '3prime' },
  { name: 'SmaI',   recognitionSequence: 'CCCGGG',   cutOffset: 3, complementCutOffset: 3, overhang: 'blunt' },
  { name: 'BglII',  recognitionSequence: 'AGATCT',   cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'ClaI',   recognitionSequence: 'ATCGAT',   cutOffset: 2, complementCutOffset: 4, overhang: '5prime' },
  { name: 'EcoRV',  recognitionSequence: 'GATATC',   cutOffset: 3, complementCutOffset: 3, overhang: 'blunt' },
  { name: 'AgeI',   recognitionSequence: 'ACCGGT',   cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'NheI',   recognitionSequence: 'GCTAGC',   cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'MluI',   recognitionSequence: 'ACGCGT',   cutOffset: 1, complementCutOffset: 5, overhang: '5prime' },
  { name: 'BsaI',   recognitionSequence: 'GGTCTC',   cutOffset: 7, complementCutOffset: 11, overhang: '5prime' },
  { name: 'BbsI',   recognitionSequence: 'GAAGAC',   cutOffset: 8, complementCutOffset: 12, overhang: '5prime' },
  { name: 'ScaI',   recognitionSequence: 'AGTACT',   cutOffset: 3, complementCutOffset: 3, overhang: 'blunt' },
  { name: 'ApaI',   recognitionSequence: 'GGGCCC',   cutOffset: 5, complementCutOffset: 1, overhang: '3prime' },
  { name: 'SphI',   recognitionSequence: 'GCATGC',   cutOffset: 5, complementCutOffset: 1, overhang: '3prime' },
];

/**
 * Build a regex pattern from IUPAC recognition sequence.
 * Handles ambiguity codes for degenerate recognition sequences.
 */
function recognitionToRegex(seq: string): RegExp {
  const iupacMap: Record<string, string> = {
    A: 'A', C: 'C', G: 'G', T: 'T',
    R: '[AG]', Y: '[CT]', S: '[GC]', W: '[AT]',
    K: '[GT]', M: '[AC]', B: '[CGT]', D: '[AGT]',
    H: '[ACT]', V: '[ACG]', N: '[ACGT]',
  };

  let pattern = '';
  for (const ch of seq.toUpperCase()) {
    pattern += iupacMap[ch] ?? ch;
  }

  // Use lookahead for overlapping matches
  return new RegExp(`(?=(${pattern}))`, 'g');
}

/**
 * Find all restriction sites in a sequence for the given enzymes.
 * @param seq - DNA sequence
 * @param enzymes - List of restriction enzymes to scan (defaults to all)
 */
export function findRestrictionSites(
  seq: string,
  enzymes: RestrictionEnzyme[] = RESTRICTION_ENZYMES,
): RestrictionSite[] {
  const sites: RestrictionSite[] = [];
  const upper = seq.toUpperCase();

  for (const enzyme of enzymes) {
    const regex = recognitionToRegex(enzyme.recognitionSequence);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(upper)) !== null) {
      sites.push({
        enzyme: enzyme.name,
        position: match.index,
        cutPosition: match.index + enzyme.cutOffset,
        recognitionSequence: enzyme.recognitionSequence,
        overhang: enzyme.overhang,
      });
      // Lookahead matches are zero-length; advance lastIndex to avoid infinite loop
      regex.lastIndex = match.index + 1;
    }
  }

  // Sort by position
  sites.sort((a, b) => a.position - b.position);
  return sites;
}

/**
 * Find enzymes that cut exactly once (unique cutters).
 */
export function findUniqueCutters(
  seq: string,
  enzymes: RestrictionEnzyme[] = RESTRICTION_ENZYMES,
): RestrictionSite[] {
  const allSites = findRestrictionSites(seq, enzymes);

  // Group by enzyme
  const byEnzyme = new Map<string, RestrictionSite[]>();
  for (const site of allSites) {
    const list = byEnzyme.get(site.enzyme) ?? [];
    list.push(site);
    byEnzyme.set(site.enzyme, list);
  }

  // Return only those that appear exactly once
  const unique: RestrictionSite[] = [];
  for (const [, sitesForEnzyme] of byEnzyme) {
    if (sitesForEnzyme.length === 1) {
      unique.push(sitesForEnzyme[0]);
    }
  }

  return unique.sort((a, b) => a.position - b.position);
}

/**
 * Find enzymes that do NOT cut the sequence (non-cutters).
 */
export function findNonCutters(
  seq: string,
  enzymes: RestrictionEnzyme[] = RESTRICTION_ENZYMES,
): RestrictionEnzyme[] {
  const allSites = findRestrictionSites(seq, enzymes);
  const cuttingEnzymes = new Set(allSites.map(s => s.enzyme));
  return enzymes.filter(e => !cuttingEnzymes.has(e.name));
}
