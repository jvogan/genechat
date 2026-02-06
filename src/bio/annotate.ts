import type { Feature, SequenceAnalysis, Strand } from './types';
import { findORFs } from './orf-detection';
import { findRestrictionSites, RESTRICTION_ENZYMES } from './restriction-sites';
import {
  gcContent,
  atContent,
  nucleotideComposition,
  molecularWeight,
  meltingTemperature,
} from './gc-content';

let featureIdCounter = 0;

function nextFeatureId(): string {
  return `feat_${++featureIdCounter}`;
}

// Color palette for ORFs by frame
const ORF_COLORS: Record<number, string> = {
  1: '#4ade80', // green
  2: '#60a5fa', // blue
  3: '#f59e0b', // amber
};

// Color for restriction sites
const RESTRICTION_COLOR = '#ef4444'; // red

/**
 * Run full auto-annotation on a DNA sequence.
 * Combines ORF detection, restriction site mapping, and GC analysis.
 */
export function autoAnnotate(
  seq: string,
  minOrfAminoAcids = 30,
): SequenceAnalysis {
  const upper = seq.toUpperCase().replace(/U/g, 'T');

  const orfs = findORFs(upper, minOrfAminoAcids);
  const restrictionSites = findRestrictionSites(upper, RESTRICTION_ENZYMES);
  const composition = nucleotideComposition(upper);
  const gc = gcContent(upper);
  const at = atContent(upper);
  const mw = molecularWeight(upper);
  const tm = meltingTemperature(upper);

  return {
    length: upper.length,
    gcContent: gc,
    atContent: at,
    molecularWeight: mw,
    meltingTemp: tm,
    orfs,
    restrictionSites,
    composition,
  };
}

/**
 * Generate Feature objects from auto-annotation results.
 * Useful for rendering on a sequence map.
 */
export function annotateToFeatures(seq: string, minOrfAminoAcids = 30): Feature[] {
  const analysis = autoAnnotate(seq, minOrfAminoAcids);
  const features: Feature[] = [];

  // Convert ORFs to features
  for (const orf of analysis.orfs) {
    features.push({
      id: nextFeatureId(),
      name: `ORF (${orf.aminoAcids} aa)`,
      type: 'orf',
      start: orf.start,
      end: orf.end,
      strand: orf.strand as Strand,
      color: ORF_COLORS[orf.frame] ?? '#9ca3af',
      metadata: {
        frame: orf.frame,
        aminoAcids: orf.aminoAcids,
        startCodon: orf.startCodon,
        stopCodon: orf.stopCodon,
      },
    });
  }

  // Convert restriction sites to features
  for (const site of analysis.restrictionSites) {
    features.push({
      id: nextFeatureId(),
      name: site.enzyme,
      type: 'restriction_site',
      start: site.position,
      end: site.position + site.recognitionSequence.length,
      strand: 1,
      color: RESTRICTION_COLOR,
      metadata: {
        cutPosition: site.cutPosition,
        overhang: site.overhang,
        recognitionSequence: site.recognitionSequence,
      },
    });
  }

  return features;
}
