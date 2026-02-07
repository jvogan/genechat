import type { Topology } from './types';
import { findRestrictionSites, RESTRICTION_ENZYMES } from './restriction-sites';

export interface DigestFragment {
  sequence: string;
  length: number;
  startInOriginal: number;
  endInOriginal: number;
  leftEnzyme: string | null;
  rightEnzyme: string | null;
}

/**
 * Preview how many times each enzyme cuts a sequence.
 * Returns a map of enzyme name → cut count.
 */
export function digestPreview(
  seq: string,
  enzymeNames: string[],
): Map<string, number> {
  const enzymes = RESTRICTION_ENZYMES.filter(e => enzymeNames.includes(e.name));
  const sites = findRestrictionSites(seq, enzymes);

  const counts = new Map<string, number>();
  for (const name of enzymeNames) {
    counts.set(name, 0);
  }
  for (const site of sites) {
    counts.set(site.enzyme, (counts.get(site.enzyme) ?? 0) + 1);
  }
  return counts;
}

/**
 * Perform a restriction digest on a sequence.
 * @param seq - The DNA sequence to digest
 * @param enzymeNames - Names of enzymes to cut with
 * @param topology - 'linear' or 'circular'
 * @returns Array of fragments sorted by position
 */
export function restrictionDigest(
  seq: string,
  enzymeNames: string[],
  topology: Topology = 'linear',
): DigestFragment[] {
  const enzymes = RESTRICTION_ENZYMES.filter(e => enzymeNames.includes(e.name));
  const sites = findRestrictionSites(seq, enzymes);

  if (sites.length === 0) {
    // No cuts — return the whole sequence as one fragment
    return [{
      sequence: seq,
      length: seq.length,
      startInOriginal: 0,
      endInOriginal: seq.length,
      leftEnzyme: null,
      rightEnzyme: null,
    }];
  }

  // Get sorted cut positions with enzyme info
  const cuts = sites.map(s => ({
    position: s.cutPosition,
    enzyme: s.enzyme,
  }));

  // Deduplicate cut positions (multiple enzymes cutting at same position)
  const uniqueCuts: typeof cuts = [];
  const seenPositions = new Set<number>();
  for (const cut of cuts) {
    if (!seenPositions.has(cut.position)) {
      seenPositions.add(cut.position);
      uniqueCuts.push(cut);
    }
  }
  uniqueCuts.sort((a, b) => a.position - b.position);

  const fragments: DigestFragment[] = [];

  if (topology === 'linear') {
    // Linear: N cuts → N+1 fragments
    for (let i = 0; i <= uniqueCuts.length; i++) {
      const start = i === 0 ? 0 : uniqueCuts[i - 1].position;
      const end = i === uniqueCuts.length ? seq.length : uniqueCuts[i].position;
      const leftEnzyme = i === 0 ? null : uniqueCuts[i - 1].enzyme;
      const rightEnzyme = i === uniqueCuts.length ? null : uniqueCuts[i].enzyme;

      if (end > start) {
        fragments.push({
          sequence: seq.slice(start, end),
          length: end - start,
          startInOriginal: start,
          endInOriginal: end,
          leftEnzyme,
          rightEnzyme,
        });
      }
    }
  } else {
    // Circular: N cuts → N fragments (wraps around origin)
    for (let i = 0; i < uniqueCuts.length; i++) {
      const start = uniqueCuts[i].position;
      const nextIdx = (i + 1) % uniqueCuts.length;
      const end = uniqueCuts[nextIdx].position;
      const leftEnzyme = uniqueCuts[i].enzyme;
      const rightEnzyme = uniqueCuts[nextIdx].enzyme;

      let fragSeq: string;
      let fragLength: number;

      if (end > start) {
        fragSeq = seq.slice(start, end);
        fragLength = end - start;
      } else {
        // Wraps around origin
        fragSeq = seq.slice(start) + seq.slice(0, end);
        fragLength = (seq.length - start) + end;
      }

      if (fragLength > 0) {
        fragments.push({
          sequence: fragSeq,
          length: fragLength,
          startInOriginal: start,
          endInOriginal: end > start ? end : end + seq.length,
          leftEnzyme,
          rightEnzyme,
        });
      }
    }
  }

  return fragments;
}
