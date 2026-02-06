import type { FastaRecord } from './types';

/**
 * Parse a FASTA-format string into records.
 * Handles multi-line sequences and multiple records.
 */
export function parseFasta(input: string): FastaRecord[] {
  const records: FastaRecord[] = [];
  const lines = input.split(/\r?\n/);
  let currentHeader = '';
  let currentDescription = '';
  let currentSeq: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) {
      // Save previous record if exists
      if (currentHeader || currentSeq.length > 0) {
        records.push({
          header: currentHeader,
          description: currentDescription,
          sequence: currentSeq.join(''),
        });
      }
      // Parse new header
      const headerLine = trimmed.slice(1).trim();
      const spaceIdx = headerLine.indexOf(' ');
      if (spaceIdx === -1) {
        currentHeader = headerLine;
        currentDescription = '';
      } else {
        currentHeader = headerLine.slice(0, spaceIdx);
        currentDescription = headerLine.slice(spaceIdx + 1).trim();
      }
      currentSeq = [];
    } else if (trimmed.length > 0) {
      // Sequence line — strip whitespace and digits
      currentSeq.push(trimmed.replace(/[\s\d]/g, ''));
    }
  }

  // Save last record
  if (currentHeader || currentSeq.length > 0) {
    records.push({
      header: currentHeader,
      description: currentDescription,
      sequence: currentSeq.join(''),
    });
  }

  return records;
}

/**
 * Convert records back to FASTA format string.
 */
export function toFasta(records: FastaRecord[], lineWidth = 80): string {
  return records
    .map(r => {
      const header = r.description ? `>${r.header} ${r.description}` : `>${r.header}`;
      const lines: string[] = [header];
      for (let i = 0; i < r.sequence.length; i += lineWidth) {
        lines.push(r.sequence.slice(i, i + lineWidth));
      }
      return lines.join('\n');
    })
    .join('\n');
}
