import type { Feature, FeatureType, Topology, Strand } from './types';

export interface GenBankRecord {
  name: string;
  length: number;
  topology: Topology;
  moleculeType: string;
  features: Feature[];
  sequence: string;
  definition?: string;
  accession?: string;
}

const FEATURE_TYPE_MAP: Record<string, FeatureType> = {
  gene: 'gene',
  cds: 'cds',
  CDS: 'cds',
  promoter: 'promoter',
  terminator: 'terminator',
  misc_feature: 'misc_feature',
  rep_origin: 'origin',
  primer_bind: 'primer_bind',
};

const FEATURE_COLORS: Record<FeatureType, string> = {
  gene: '#60a5fa',
  cds: '#4ade80',
  promoter: '#fbbf24',
  terminator: '#fb7185',
  misc_feature: '#a78bfa',
  origin: '#22d3ee',
  primer_bind: '#f97316',
  orf: '#4ade80',
  rbs: '#a78bfa',
  resistance: '#fb7185',
  restriction_site: '#6b7280',
  custom: '#6b7280',
};

/**
 * Parse a location string like "100..200", "complement(100..200)",
 * "join(1..100,200..300)", or a single position "100".
 * Returns 0-indexed start (inclusive) and end (exclusive), plus strand.
 */
function parseLocation(loc: string): { start: number; end: number; strand: Strand } {
  let strand: Strand = 1;
  let inner = loc.trim();

  // Handle complement()
  if (inner.startsWith('complement(') && inner.endsWith(')')) {
    strand = -1;
    inner = inner.slice(11, -1);
  }

  // Handle join() — use outermost range
  if (inner.startsWith('join(') && inner.endsWith(')')) {
    inner = inner.slice(5, -1);
    const parts = inner.split(',');
    const allPositions: number[] = [];
    for (const part of parts) {
      const nums = part.replace(/[<>]/g, '').split('..').map(Number);
      allPositions.push(...nums);
    }
    const min = Math.min(...allPositions);
    const max = Math.max(...allPositions);
    return { start: min - 1, end: max, strand };
  }

  // Handle order() similarly to join()
  if (inner.startsWith('order(') && inner.endsWith(')')) {
    inner = inner.slice(6, -1);
    const parts = inner.split(',');
    const allPositions: number[] = [];
    for (const part of parts) {
      const nums = part.replace(/[<>]/g, '').split('..').map(Number);
      allPositions.push(...nums);
    }
    const min = Math.min(...allPositions);
    const max = Math.max(...allPositions);
    return { start: min - 1, end: max, strand };
  }

  // Strip partial indicators < and >
  inner = inner.replace(/[<>]/g, '');

  // Simple range: "100..200"
  if (inner.includes('..')) {
    const [s, e] = inner.split('..').map(Number);
    return { start: s - 1, end: e, strand };
  }

  // Single position: "100"
  const pos = parseInt(inner, 10);
  return { start: pos - 1, end: pos, strand };
}

/**
 * Parse the FEATURES section of a GenBank record.
 */
function parseFeatures(featuresText: string): Feature[] {
  const features: Feature[] = [];
  // Split into individual feature entries. Features start with a type at column 5
  // (i.e. 5 spaces followed by a non-space character).
  const featureBlocks: string[] = [];
  const lines = featuresText.split('\n');
  let current = '';

  for (const line of lines) {
    // Feature type line: exactly 5 spaces then a non-space
    if (/^     \S/.test(line)) {
      if (current) featureBlocks.push(current);
      current = line + '\n';
    } else if (current) {
      current += line + '\n';
    }
  }
  if (current) featureBlocks.push(current);

  for (const block of featureBlocks) {
    const blockLines = block.split('\n');
    const firstLine = blockLines[0];

    // Extract feature key and location from first line
    const match = firstLine.match(/^\s{5}(\S+)\s+(.*)/);
    if (!match) continue;

    const featureKey = match[1].toLowerCase();
    let locationStr = match[2].trim();

    // Location can span multiple lines (before qualifiers start)
    let lineIdx = 1;
    while (lineIdx < blockLines.length) {
      const l = blockLines[lineIdx].trim();
      if (l.startsWith('/') || l === '') break;
      locationStr += l;
      lineIdx++;
    }

    // Parse qualifiers
    const qualifiers: Record<string, string> = {};
    let currentQualKey = '';
    let currentQualVal = '';

    for (let i = lineIdx; i < blockLines.length; i++) {
      const l = blockLines[i].trim();
      if (!l) continue;

      if (l.startsWith('/')) {
        // Save previous qualifier
        if (currentQualKey) {
          qualifiers[currentQualKey] = currentQualVal.replace(/^"|"$/g, '');
        }
        const eqIdx = l.indexOf('=');
        if (eqIdx === -1) {
          currentQualKey = l.slice(1);
          currentQualVal = '';
        } else {
          currentQualKey = l.slice(1, eqIdx);
          currentQualVal = l.slice(eqIdx + 1);
        }
      } else if (currentQualKey) {
        // Continuation of a multi-line qualifier value
        currentQualVal += ' ' + l;
      }
    }
    // Save last qualifier
    if (currentQualKey) {
      qualifiers[currentQualKey] = currentQualVal.replace(/^"|"$/g, '');
    }

    // Determine feature type
    const mappedType: FeatureType = FEATURE_TYPE_MAP[featureKey] ?? 'custom';

    // Determine name from qualifiers
    const name =
      qualifiers['gene'] ||
      qualifiers['product'] ||
      qualifiers['label'] ||
      qualifiers['note'] ||
      featureKey;

    // Parse location
    const { start, end, strand } = parseLocation(locationStr);

    features.push({
      id: crypto.randomUUID(),
      name: name.replace(/^"|"$/g, ''),
      type: mappedType,
      start,
      end,
      strand,
      color: FEATURE_COLORS[mappedType],
      metadata: qualifiers,
    });
  }

  return features;
}

/**
 * Parse one or more GenBank records from a string.
 * Records are separated by `//`.
 */
export function parseGenBank(input: string): GenBankRecord[] {
  const records: GenBankRecord[] = [];
  // Split on record terminators
  const rawRecords = input.split(/\n\/\//).filter((r) => r.trim().length > 0);

  for (const raw of rawRecords) {
    const lines = raw.split('\n');
    let name = 'Unknown';
    let length = 0;
    let topology: Topology = 'linear';
    let moleculeType = '';
    let definition = '';
    let accession = '';
    let featuresText = '';
    let sequence = '';

    let section: 'header' | 'features' | 'origin' | 'none' = 'header';
    let definitionLines: string[] = [];
    let inDefinition = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('LOCUS')) {
        // Parse LOCUS line
        // Format: LOCUS name length bp/aa molecule topology date
        const parts = line.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) name = parts[1];
        // Find length (number followed by bp or aa)
        for (let j = 2; j < parts.length; j++) {
          if (/^\d+$/.test(parts[j]) && j + 1 < parts.length && /^(bp|aa)$/i.test(parts[j + 1])) {
            length = parseInt(parts[j], 10);
            break;
          }
        }
        // Check for circular/linear
        if (/\bcircular\b/i.test(line)) topology = 'circular';
        if (/\blinear\b/i.test(line)) topology = 'linear';
        // Molecule type
        const molMatch = line.match(/\b(DNA|RNA|mRNA|ds-DNA|ss-DNA|ds-RNA|ss-RNA)\b/i);
        if (molMatch) moleculeType = molMatch[1];
        section = 'header';
        inDefinition = false;
        continue;
      }

      if (line.startsWith('DEFINITION')) {
        definition = line.replace(/^DEFINITION\s+/, '').trim();
        inDefinition = true;
        definitionLines = [definition];
        continue;
      }

      if (inDefinition && line.startsWith('            ')) {
        definitionLines.push(line.trim());
        continue;
      } else {
        if (inDefinition) {
          definition = definitionLines.join(' ');
          inDefinition = false;
        }
      }

      if (line.startsWith('ACCESSION')) {
        accession = line.replace(/^ACCESSION\s+/, '').trim();
        continue;
      }

      if (line.startsWith('FEATURES')) {
        section = 'features';
        continue;
      }

      if (line.startsWith('ORIGIN')) {
        section = 'origin';
        continue;
      }

      if (section === 'features') {
        featuresText += line + '\n';
      }

      if (section === 'origin') {
        // Sequence lines: strip leading numbers and spaces
        const seqLine = line.replace(/[\s\d/]/g, '');
        sequence += seqLine;
      }
    }

    // Finalize definition if record ended while in definition
    if (inDefinition) {
      definition = definitionLines.join(' ');
    }

    const features = featuresText ? parseFeatures(featuresText) : [];
    if (!length && sequence.length > 0) length = sequence.length;

    records.push({
      name,
      length,
      topology,
      moleculeType,
      features,
      sequence: sequence.toLowerCase(),
      definition: definition || undefined,
      accession: accession || undefined,
    });
  }

  return records;
}
