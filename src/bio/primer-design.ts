import type { Feature } from './types';
import { gcContent, meltingTemperature } from './gc-content';
import { reverseComplement } from './reverse-complement';

export interface PrimerDesignParams {
  targetStart: number;
  targetEnd: number;
  minLength?: number;
  maxLength?: number;
  targetTm?: number;
  tmTolerance?: number;
  minGC?: number;
  maxGC?: number;
  forwardTail?: string;
  reverseTail?: string;
}

export interface PrimerCandidate {
  sequence: string;       // binding region only
  fullSequence: string;   // tail + binding region
  tail: string;           // 5' tail (empty string if none)
  start: number;
  end: number;
  length: number;         // binding region length
  fullLength: number;     // total length including tail
  tm: number;             // Tm of binding region only
  gcPercent: number;      // GC% of binding region only
  direction: 'forward' | 'reverse';
}

export interface PrimerPair {
  forward: PrimerCandidate;
  reverse: PrimerCandidate;
  productLength: number;
  tmDifference: number;
}

const DEFAULT_MIN_LENGTH = 18;
const DEFAULT_MAX_LENGTH = 28;
const DEFAULT_TARGET_TM = 60;
const DEFAULT_TM_TOLERANCE = 3;
const DEFAULT_MIN_GC = 0.30;
const DEFAULT_MAX_GC = 0.70;

/**
 * Design forward primers starting from targetStart.
 * Scans primer lengths from minLength to maxLength, filters by Tm and GC%.
 */
export function designForwardPrimer(
  seq: string,
  params: PrimerDesignParams,
): PrimerCandidate[] {
  const {
    targetStart,
    minLength = DEFAULT_MIN_LENGTH,
    maxLength = DEFAULT_MAX_LENGTH,
    targetTm = DEFAULT_TARGET_TM,
    tmTolerance = DEFAULT_TM_TOLERANCE,
    minGC = DEFAULT_MIN_GC,
    maxGC = DEFAULT_MAX_GC,
    forwardTail = '',
  } = params;

  const upper = seq.toUpperCase();
  const tail = forwardTail.toUpperCase().replace(/[^ACGT]/g, '');
  const candidates: PrimerCandidate[] = [];

  for (let len = minLength; len <= maxLength; len++) {
    if (targetStart + len > upper.length) break;

    const primerSeq = upper.slice(targetStart, targetStart + len);
    const gc = gcContent(primerSeq);
    const tm = meltingTemperature(primerSeq);

    if (tm === null) continue;
    if (gc < minGC || gc > maxGC) continue;
    if (Math.abs(tm - targetTm) > tmTolerance) continue;

    candidates.push({
      sequence: primerSeq,
      fullSequence: tail + primerSeq,
      tail,
      start: targetStart,
      end: targetStart + len,
      length: len,
      fullLength: tail.length + len,
      tm,
      gcPercent: gc * 100,
      direction: 'forward',
    });
  }

  // Sort by closeness to target Tm
  candidates.sort((a, b) => Math.abs(a.tm - targetTm) - Math.abs(b.tm - targetTm));
  return candidates;
}

/**
 * Design reverse primers ending at targetEnd.
 * Returns the reverse complement of the template region.
 */
export function designReversePrimer(
  seq: string,
  params: PrimerDesignParams,
): PrimerCandidate[] {
  const {
    targetEnd,
    minLength = DEFAULT_MIN_LENGTH,
    maxLength = DEFAULT_MAX_LENGTH,
    targetTm = DEFAULT_TARGET_TM,
    tmTolerance = DEFAULT_TM_TOLERANCE,
    minGC = DEFAULT_MIN_GC,
    maxGC = DEFAULT_MAX_GC,
    reverseTail = '',
  } = params;

  const upper = seq.toUpperCase();
  const tail = reverseTail.toUpperCase().replace(/[^ACGT]/g, '');
  const candidates: PrimerCandidate[] = [];

  for (let len = minLength; len <= maxLength; len++) {
    const start = targetEnd - len;
    if (start < 0) break;

    const templateRegion = upper.slice(start, targetEnd);
    const primerSeq = reverseComplement(templateRegion);
    const gc = gcContent(primerSeq);
    const tm = meltingTemperature(primerSeq);

    if (tm === null) continue;
    if (gc < minGC || gc > maxGC) continue;
    if (Math.abs(tm - targetTm) > tmTolerance) continue;

    candidates.push({
      sequence: primerSeq,
      fullSequence: tail + primerSeq,
      tail,
      start,
      end: targetEnd,
      length: len,
      fullLength: tail.length + len,
      tm,
      gcPercent: gc * 100,
      direction: 'reverse',
    });
  }

  // Sort by closeness to target Tm
  candidates.sort((a, b) => Math.abs(a.tm - targetTm) - Math.abs(b.tm - targetTm));
  return candidates;
}

/**
 * Design primer pairs for a target region.
 * Pairs forward and reverse primers, filtering by Tm difference.
 */
export function designPrimerPair(
  seq: string,
  params: PrimerDesignParams,
): PrimerPair[] {
  const maxTmDiff = 5;
  const forwards = designForwardPrimer(seq, params);
  const reverses = designReversePrimer(seq, params);

  const pairs: PrimerPair[] = [];

  for (const fwd of forwards) {
    for (const rev of reverses) {
      const tmDiff = Math.abs(fwd.tm - rev.tm);
      if (tmDiff > maxTmDiff) continue;

      const productLength = rev.end - fwd.start;
      if (productLength <= 0) continue;

      pairs.push({
        forward: fwd,
        reverse: rev,
        productLength,
        tmDifference: tmDiff,
      });
    }
  }

  // Sort by Tm difference, then product length
  pairs.sort((a, b) => a.tmDifference - b.tmDifference || a.productLength - b.productLength);

  // Return top 10 pairs
  return pairs.slice(0, 10);
}

/**
 * Convert a primer candidate into a Feature annotation.
 */
export function primerToFeature(primer: PrimerCandidate, name: string): Feature {
  return {
    id: crypto.randomUUID(),
    name,
    type: 'primer_bind',
    start: primer.start,
    end: primer.end,
    strand: primer.direction === 'forward' ? 1 : -1,
    color: '#a78bfa', // purple
    metadata: {
      tm: primer.tm,
      gcPercent: primer.gcPercent,
      primerSequence: primer.sequence,
      fullSequence: primer.fullSequence,
      tail: primer.tail,
    },
  };
}

/** Quick-pick enzyme tail presets: 4 protective GC bases + recognition sequence */
export const ENZYME_TAIL_PRESETS: Array<{ name: string; tail: string }> = [
  { name: 'EcoRI', tail: 'GCGCGAATTC' },
  { name: 'BamHI', tail: 'GCGCGGATCC' },
  { name: 'HindIII', tail: 'GCGCAAGCTT' },
  { name: 'NcoI', tail: 'GCGCCCATGG' },
  { name: 'XhoI', tail: 'GCGCCTCGAG' },
  { name: 'NdeI', tail: 'GCGCCATATG' },
];
