import type { Feature } from './types';

export interface LigationInput {
  sequence: string;
  name: string;
  features: Feature[];
}

export interface LigationResult {
  sequence: string;
  features: Feature[];
}

/**
 * Ligate (join) multiple DNA fragments in order.
 * Features are carried over with coordinates shifted by running offset.
 * @param fragments - Ordered array of fragments to join
 * @param linker - Optional linker sequence inserted between fragments
 */
export function ligate(
  fragments: LigationInput[],
  linker = '',
): LigationResult {
  if (fragments.length === 0) {
    return { sequence: '', features: [] };
  }

  let sequence = '';
  const features: Feature[] = [];
  const linkerUpper = linker.toUpperCase();

  for (let i = 0; i < fragments.length; i++) {
    const frag = fragments[i];
    // Add linker between fragments (not before the first)
    if (i > 0 && linkerUpper.length > 0) {
      sequence += linkerUpper;
    }

    const fragOffset = sequence.length;

    // Add the fragment sequence
    sequence += frag.sequence;

    // Shift feature coordinates
    for (const feat of frag.features) {
      features.push({
        ...feat,
        id: crypto.randomUUID(),
        start: feat.start + fragOffset,
        end: feat.end + fragOffset,
      });
    }
  }

  return { sequence, features };
}
