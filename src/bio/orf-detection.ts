import type { ORF, CodonTable } from './types';
import { STANDARD_CODE } from './codon-tables';
import { reverseComplement } from './reverse-complement';

/**
 * Find all ORFs in a DNA sequence across all 3 reading frames on both strands.
 * @param seq - DNA sequence
 * @param minAminoAcids - Minimum ORF length in amino acids (default 30 = 90bp)
 * @param table - Codon table (defaults to standard)
 * @returns Array of ORFs sorted by length descending
 */
export function findORFs(
  seq: string,
  minAminoAcids = 30,
  table: CodonTable = STANDARD_CODE,
): ORF[] {
  const orfs: ORF[] = [];
  const upper = seq.toUpperCase().replace(/U/g, 'T');
  const revComp = reverseComplement(upper);

  // Search forward strand
  for (let frame = 0; frame < 3; frame++) {
    const found = findORFsInFrame(upper, frame, 1 as const, table, minAminoAcids);
    orfs.push(...found);
  }

  // Search reverse strand
  for (let frame = 0; frame < 3; frame++) {
    const found = findORFsInFrame(revComp, frame, -1 as const, table, minAminoAcids);
    // Convert positions back to forward strand coordinates
    for (const orf of found) {
      const origStart = upper.length - orf.end;
      const origEnd = upper.length - orf.start;
      orf.start = origStart;
      orf.end = origEnd;
    }
    orfs.push(...found);
  }

  // Sort by length descending
  orfs.sort((a, b) => b.length - a.length);
  return orfs;
}

function findORFsInFrame(
  seq: string,
  frameOffset: number,
  strand: 1 | -1,
  table: CodonTable,
  minAminoAcids: number,
): ORF[] {
  const orfs: ORF[] = [];
  const stops = new Set(table.stops);
  const starts = new Set(table.starts);

  // Collect all start and stop codon positions in this frame
  const startPositions: number[] = [];
  const stopPositions: number[] = [];

  for (let i = frameOffset; i + 2 < seq.length; i += 3) {
    const codon = seq.slice(i, i + 3);
    if (starts.has(codon)) startPositions.push(i);
    if (stops.has(codon)) stopPositions.push(i);
  }

  // For each start codon, find the next stop codon
  for (const startPos of startPositions) {
    let foundStop = false;
    for (const stopPos of stopPositions) {
      if (stopPos > startPos) {
        const bpLength = stopPos + 3 - startPos; // include stop codon
        const aaLength = Math.floor(bpLength / 3) - 1; // exclude stop
        if (aaLength >= minAminoAcids) {
          orfs.push({
            start: startPos,
            end: stopPos + 3,
            frame: ((frameOffset % 3) + 1) as 1 | 2 | 3,
            strand,
            length: bpLength,
            aminoAcids: aaLength,
            startCodon: seq.slice(startPos, startPos + 3),
            stopCodon: seq.slice(stopPos, stopPos + 3),
          });
        }
        foundStop = true;
        break;
      }
    }
    // If no stop codon found, treat end of sequence as implicit stop
    if (!foundStop) {
      const bpLength = seq.length - startPos;
      const aaLength = Math.floor(bpLength / 3);
      if (aaLength >= minAminoAcids) {
        orfs.push({
          start: startPos,
          end: seq.length,
          frame: ((frameOffset % 3) + 1) as 1 | 2 | 3,
          strand,
          length: bpLength,
          aminoAcids: aaLength,
          startCodon: seq.slice(startPos, startPos + 3),
          stopCodon: '',
        });
      }
    }
  }

  return orfs;
}

/**
 * Find the longest ORF in a sequence.
 */
export function findLongestORF(
  seq: string,
  table: CodonTable = STANDARD_CODE,
): ORF | null {
  const orfs = findORFs(seq, 1, table);
  return orfs.length > 0 ? orfs[0] : null;
}
