import { describe, it, expect } from 'vitest';
import { findRestrictionSites } from '../restriction-sites';
import { restrictionDigest, digestPreview } from '../restriction-digest';
import { ligate } from '../ligate';
import { designForwardPrimer, designReversePrimer, designPrimerPair, primerToFeature } from '../primer-design';
import { sequenceDiff } from '../sequence-diff';
import { findMotif } from '../motif-search';
import { proteinMolecularWeight } from '../gc-content';

const PUC19 = 'TCGCGCGTTTCGGTGATGACGGTGAAAACCTCTGACACATGCAGCTCCCGGAGACGGTCACAGCTTGTCTGTAAGCGGATGCCGGGAGCAGACAAGCCCGTCAGGGCGCGTCAGCGGGTGTTGGCGGGTGTCGGGGCTGGCTTAACTATGCGGCATCAGAGCAGATTGTACTGAGAGTGCACCATATGCGGTGTGAAATACCGCACAGATGCGTAAGGAGAAAATACCGCATCAGGCGCCATTCGCCATTCAGGCTGCGCAACTGTTGGGAAGGGCGATCGGTGCGGGCCTCTTCGCTATTACGCCAGCTGGCGAAAGGGGGATGTGCTGCAAGGCGATTAAGTTGGGTAACGCCAGGGTTTTCCCAGTCACGACGTTGTAAAACGACGGCCAGTGAATTCGAGCTCGGTACCCGGGGATCCTCTAGAGTCGACCTGCAGGCATGCAAGCTTGGCGTAATCATGGTCATAGCTGTTTCCTGTGTGAAATTGTTATCCGCTCACAATTCCACACAACATACGAGCCGGAAGCATAAAGTGTAAAGCCTGGGGTGCCTAATGAGTGAGCTAACTCACATTAATTGCGTTGCGCTCACTGCCCGCTTTCCAGTCGGGAAACCTGTCGTGCCAGCTGCATTAATGAATCGGCCAACGCGCGGGGAGAGGCGGTTTGCGTATTGGGCGCTCTTCCGCTTCCTCGCTCACTGACTCGCTGCGCTCGGTCGTTCGGCTGCGGCGAGCGGTATCAGCTCACTCAAAGGCGGTAATACGGTTATCCACAGAATCAGGGGATAACGCAGGAAAGAACATGTGAGCAAAAGGCCAGCAAAAGGCCAGGAACCGTAAAAAGGCCGCGTTGCTGGCGTTTTTCCATAGGCTCCGCCCCCCTGACGAGCATCACAAAAATCGACGCTCAAGTCAGAGGTGGCGAAACCCGACAGGACTATAAAGATACCAGGCGTTTCCCCCTGGAAGCTCCCTCGTGCGCTCTCCTGTTCCGACCCTGCCGCTTACCGGATACCTGTCCGCCTTTCTCCCTTCGGGAAGCGTGGCGCTTTCTCATAGCTCACGCTGTAGGTATCTCAGTTCGGTGTAGGTCGTTCGCTCCAAGCTGGGCTGTGTGCACGAACCCCCCGTTCAGCCCGACCGCTGCGCCTTATCCGGTAACTATCGTCTTGAGTCCAACCCGGTAAGACACGACTTATCGCCACTGGCAGCAGCCACTGGTAAC';

describe('Restriction Digest', () => {
  it('finds restriction sites in pUC19', () => {
    const sites = findRestrictionSites(PUC19);
    expect(sites.length).toBeGreaterThan(0);
  });

  it('digest preview returns correct counts', () => {
    const counts = digestPreview(PUC19, ['EcoRI', 'BamHI']);
    expect(counts.get('EcoRI')).toBeDefined();
    expect(counts.get('BamHI')).toBeDefined();
  });

  it('linear digest fragments sum to original length', () => {
    const sites = findRestrictionSites(PUC19);
    const cuttingEnzymes = [...new Set(sites.map(s => s.enzyme))];
    if (cuttingEnzymes.length > 0) {
      const fragments = restrictionDigest(PUC19, [cuttingEnzymes[0]], 'linear');
      const totalLen = fragments.reduce((s, f) => s + f.length, 0);
      expect(totalLen).toBe(PUC19.length);
    }
  });

  it('no cuts returns one fragment', () => {
    const fragments = restrictionDigest('AAAA', ['EcoRI'], 'linear');
    expect(fragments).toHaveLength(1);
    expect(fragments[0].sequence).toBe('AAAA');
    expect(fragments[0].leftEnzyme).toBeNull();
    expect(fragments[0].rightEnzyme).toBeNull();
  });

  it('handles circular topology', () => {
    const seq = 'ATGCGAATTCATGCATGCATGCGAATTCATGC';
    const fragments = restrictionDigest(seq, ['EcoRI'], 'circular');
    expect(fragments.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Ligation', () => {
  it('joins two fragments', () => {
    const result = ligate([
      { sequence: 'ATGCCC', name: 'F1', features: [] },
      { sequence: 'GGGCAT', name: 'F2', features: [] },
    ]);
    expect(result.sequence).toBe('ATGCCCGGGCAT');
    expect(result.features).toHaveLength(0);
  });

  it('inserts linker between fragments', () => {
    const result = ligate([
      { sequence: 'AAA', name: 'F1', features: [] },
      { sequence: 'TTT', name: 'F2', features: [] },
    ], 'GGG');
    expect(result.sequence).toBe('AAAGGG' + 'TTT');
    expect(result.sequence.length).toBe(9);
  });

  it('shifts feature coordinates', () => {
    const result = ligate([
      { sequence: 'AAAA', name: 'F1', features: [
        { id: 'x', name: 'feat1', type: 'cds', start: 0, end: 4, strand: 1, color: '#f00', metadata: {} }
      ]},
      { sequence: 'TTTT', name: 'F2', features: [
        { id: 'y', name: 'feat2', type: 'cds', start: 0, end: 4, strand: 1, color: '#0f0', metadata: {} }
      ]},
    ]);
    expect(result.features).toHaveLength(2);
    expect(result.features[0].start).toBe(0);
    expect(result.features[0].end).toBe(4);
    expect(result.features[1].start).toBe(4);
    expect(result.features[1].end).toBe(8);
  });

  it('handles empty input', () => {
    const result = ligate([]);
    expect(result.sequence).toBe('');
    expect(result.features).toHaveLength(0);
  });
});

describe('Primer Design', () => {
  it('designs forward primers', () => {
    const primers = designForwardPrimer(PUC19, {
      targetStart: 350,
      targetEnd: 750,
    });
    expect(primers.length).toBeGreaterThan(0);
    for (const p of primers) {
      expect(p.direction).toBe('forward');
      expect(p.length).toBeGreaterThanOrEqual(18);
      expect(p.length).toBeLessThanOrEqual(28);
      expect(p.tm).toBeGreaterThan(40);
    }
  });

  it('designs reverse primers', () => {
    const primers = designReversePrimer(PUC19, {
      targetStart: 350,
      targetEnd: 750,
    });
    expect(primers.length).toBeGreaterThan(0);
    for (const p of primers) {
      expect(p.direction).toBe('reverse');
    }
  });

  it('designs primer pairs with matching Tm', () => {
    const pairs = designPrimerPair(PUC19, {
      targetStart: 350,
      targetEnd: 750,
    });
    expect(pairs.length).toBeGreaterThan(0);
    for (const pair of pairs) {
      expect(pair.tmDifference).toBeLessThanOrEqual(5);
      expect(pair.productLength).toBeGreaterThan(0);
    }
  });

  it('converts primer to feature', () => {
    const primer = {
      sequence: 'ATGCGATCGATCGATCGATCG',
      fullSequence: 'ATGCGATCGATCGATCGATCG',
      tail: '',
      start: 100,
      end: 121,
      length: 21,
      fullLength: 21,
      tm: 62.5,
      gcPercent: 52.4,
      direction: 'forward' as const,
    };
    const feature = primerToFeature(primer, 'Test primer');
    expect(feature.type).toBe('primer_bind');
    expect(feature.start).toBe(100);
    expect(feature.end).toBe(121);
    expect(feature.strand).toBe(1);
    expect(feature.color).toBe('#a78bfa');
  });
});

describe('Sequence Diff', () => {
  it('detects identical sequences', () => {
    const result = sequenceDiff('ATGCATGC', 'ATGCATGC');
    expect(result.identity).toBe(100);
    expect(result.mismatches).toBe(0);
    expect(result.insertions).toBe(0);
    expect(result.deletions).toBe(0);
  });

  it('detects mismatches', () => {
    const result = sequenceDiff('ATGCATGC', 'ATGCTTGC');
    expect(result.mismatches).toBe(1);
    expect(result.identity).toBeGreaterThan(80);
    expect(result.identity).toBeLessThan(100);
  });

  it('handles empty sequences', () => {
    const result = sequenceDiff('', '');
    expect(result.identity).toBe(0);
    expect(result.aligned1).toBe('');
    expect(result.aligned2).toBe('');
  });

  it('provides aligned sequences for matches', () => {
    const result = sequenceDiff('ATGC', 'ATGC');
    expect(result.aligned1).toBe('ATGC');
    expect(result.aligned2).toBe('ATGC');
  });

  it('uses simple diff for very long sequences', () => {
    const long1 = 'A'.repeat(6000);
    const long2 = 'A'.repeat(5000) + 'T'.repeat(1000);
    const result = sequenceDiff(long1, long2);
    expect(result.aligned1.length).toBe(result.aligned2.length);
  });

  it('detects insertions via NW alignment', () => {
    const result = sequenceDiff('ATGCATGC', 'ATGCAAATGC');
    expect(result.insertions + result.mismatches).toBeGreaterThan(0);
    expect(result.aligned1.length).toBe(result.aligned2.length);
  });
});

describe('Motif Search', () => {
  it('finds exact matches', () => {
    const matches = findMotif('ATGATGATG', 'ATG');
    expect(matches.length).toBe(3);
    expect(matches[0].start).toBe(0);
    expect(matches[1].start).toBe(3);
    expect(matches[2].start).toBe(6);
  });

  it('finds overlapping matches', () => {
    const matches = findMotif('AAAA', 'AA');
    expect(matches.length).toBe(3); // positions 0, 1, 2
    expect(matches.map(m => m.start)).toEqual([0, 1, 2]);
  });

  it('handles IUPAC ambiguity codes', () => {
    // R = A or G
    const matches = findMotif('ATGCATGC', 'RTG');
    expect(matches.length).toBe(2); // ATG at 0, ATG at 4
    expect(matches[0].start).toBe(0);
    expect(matches[1].start).toBe(4);
  });

  it('returns empty for no match', () => {
    const matches = findMotif('AAAA', 'CCCC');
    expect(matches.length).toBe(0);
  });

  it('returns empty for empty pattern', () => {
    const matches = findMotif('ATGC', '');
    expect(matches.length).toBe(0);
  });

  it('case insensitive matching', () => {
    const matches = findMotif('atgatg', 'ATG');
    expect(matches.length).toBe(2);
  });
});

describe('Primer Tails', () => {
  it('forward primer includes tail in fullSequence', () => {
    const primers = designForwardPrimer(PUC19, {
      targetStart: 350,
      targetEnd: 750,
      forwardTail: 'GCGCGAATTC',
    });
    expect(primers.length).toBeGreaterThan(0);
    for (const p of primers) {
      expect(p.tail).toBe('GCGCGAATTC');
      expect(p.fullSequence).toBe('GCGCGAATTC' + p.sequence);
      expect(p.fullLength).toBe(p.length + 10);
    }
  });

  it('reverse primer includes tail in fullSequence', () => {
    const primers = designReversePrimer(PUC19, {
      targetStart: 350,
      targetEnd: 750,
      reverseTail: 'GCGCGGATCC',
    });
    expect(primers.length).toBeGreaterThan(0);
    for (const p of primers) {
      expect(p.tail).toBe('GCGCGGATCC');
      expect(p.fullSequence).toBe('GCGCGGATCC' + p.sequence);
      expect(p.fullLength).toBe(p.length + 10);
    }
  });

  it('Tm is calculated on binding region only', () => {
    const withoutTail = designForwardPrimer(PUC19, {
      targetStart: 350,
      targetEnd: 750,
    });
    const withTail = designForwardPrimer(PUC19, {
      targetStart: 350,
      targetEnd: 750,
      forwardTail: 'GCGCGAATTC',
    });
    if (withoutTail.length > 0 && withTail.length > 0) {
      // Same binding region should have same Tm
      const matchingNoTail = withoutTail.find(p => p.sequence === withTail[0].sequence);
      if (matchingNoTail) {
        expect(matchingNoTail.tm).toBe(withTail[0].tm);
      }
    }
  });

  it('empty tail produces no tail in output', () => {
    const primers = designForwardPrimer(PUC19, {
      targetStart: 350,
      targetEnd: 750,
    });
    expect(primers.length).toBeGreaterThan(0);
    expect(primers[0].tail).toBe('');
    expect(primers[0].fullSequence).toBe(primers[0].sequence);
  });
});

describe('Protein MW', () => {
  it('calculates molecular weight for short peptide', () => {
    const mw = proteinMolecularWeight('MAG');
    expect(mw).toBeGreaterThan(200);
    expect(mw).toBeLessThan(500);
  });

  it('returns 0 for empty sequence', () => {
    expect(proteinMolecularWeight('')).toBe(0);
  });

  it('strips stop codons', () => {
    const mw1 = proteinMolecularWeight('MAG*');
    const mw2 = proteinMolecularWeight('MAG');
    expect(mw1).toBe(mw2);
  });
});
