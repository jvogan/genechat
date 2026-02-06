import type { Conversation, SequenceBlock } from '../store/types';

export function exportToMarkdown(
  conversation: Conversation,
  blocks: SequenceBlock[],
): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`title: "${conversation.title}"`);
  lines.push(`id: ${conversation.id}`);
  lines.push(`created: ${new Date(conversation.createdAt).toISOString()}`);
  lines.push(`updated: ${new Date(conversation.updatedAt).toISOString()}`);
  lines.push(`blocks: ${blocks.length}`);
  lines.push('---');
  lines.push('');

  lines.push(`# ${conversation.title}`);
  lines.push('');

  for (const block of blocks) {
    lines.push(`## ${block.name}`);
    lines.push('');
    lines.push(`- **Type:** ${block.type}`);
    lines.push(`- **Length:** ${block.raw.length} bp`);
    lines.push(`- **Topology:** ${block.topology}`);

    if (block.notes) {
      lines.push(`- **Notes:** ${block.notes}`);
    }

    if (block.analysis) {
      lines.push(`- **GC Content:** ${(block.analysis.gcContent * 100).toFixed(1)}%`);
      lines.push(`- **Molecular Weight:** ${block.analysis.molecularWeight.toFixed(0)} Da`);
      if (block.analysis.meltingTemp != null) {
        lines.push(`- **Melting Temp:** ${block.analysis.meltingTemp.toFixed(1)} C`);
      }
      lines.push(`- **ORFs Found:** ${block.analysis.orfs.length}`);
    }

    if (block.features.length > 0) {
      lines.push('');
      lines.push('### Features');
      lines.push('');
      lines.push('| Name | Type | Start | End | Strand |');
      lines.push('|------|------|-------|-----|--------|');
      for (const f of block.features) {
        lines.push(`| ${f.name} | ${f.type} | ${f.start} | ${f.end} | ${f.strand === 1 ? '+' : '-'} |`);
      }
    }

    lines.push('');
    lines.push(`\`\`\`${block.type === 'protein' ? 'protein' : 'dna'}`);
    // Wrap sequence at 80 chars
    for (let i = 0; i < block.raw.length; i += 80) {
      lines.push(block.raw.slice(i, i + 80));
    }
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

export function exportToFasta(blocks: SequenceBlock[]): string {
  return blocks
    .map((block) => {
      const header = `>${block.name} [${block.type}] [${block.raw.length}bp] [${block.topology}]`;
      const seqLines: string[] = [];
      for (let i = 0; i < block.raw.length; i += 80) {
        seqLines.push(block.raw.slice(i, i + 80));
      }
      return `${header}\n${seqLines.join('\n')}`;
    })
    .join('\n\n');
}

export function exportToGenBank(block: SequenceBlock): string {
  const lines: string[] = [];

  // LOCUS line
  const locusName = block.name.slice(0, 16).replace(/\s+/g, '_');
  const molType = block.type === 'protein' ? 'aa' : 'DNA';
  const topo = block.topology === 'circular' ? 'circular' : 'linear';
  lines.push(`LOCUS       ${locusName.padEnd(16)} ${String(block.raw.length).padStart(7)} bp    ${molType.padEnd(6)}  ${topo} UNK 01-JAN-2026`);
  lines.push(`DEFINITION  ${block.name}.`);
  lines.push(`ACCESSION   unknown`);

  // FEATURES
  if (block.features.length > 0) {
    lines.push('FEATURES             Location/Qualifiers');
    for (const f of block.features) {
      const location = f.strand === -1
        ? `complement(${f.start + 1}..${f.end})`
        : `${f.start + 1}..${f.end}`;
      lines.push(`     ${f.type.padEnd(15)} ${location}`);
      lines.push(`                     /label="${f.name}"`);
    }
  }

  // ORIGIN
  lines.push('ORIGIN');
  const seq = block.raw.toLowerCase();
  for (let i = 0; i < seq.length; i += 60) {
    const lineNum = String(i + 1).padStart(9);
    const chunks: string[] = [];
    for (let j = i; j < Math.min(i + 60, seq.length); j += 10) {
      chunks.push(seq.slice(j, Math.min(j + 10, seq.length)));
    }
    lines.push(`${lineNum} ${chunks.join(' ')}`);
  }

  lines.push('//');
  return lines.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
