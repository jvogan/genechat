export type FileFormat = 'fasta' | 'genbank' | 'raw';

export function detectFileFormat(content: string): FileFormat {
  const trimmed = content.trimStart();
  if (trimmed.startsWith('>')) return 'fasta';
  if (trimmed.startsWith('LOCUS')) return 'genbank';
  return 'raw';
}
