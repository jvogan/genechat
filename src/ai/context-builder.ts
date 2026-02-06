import type { SequenceBlock } from '../store/types';
import type { AIMessage } from './types';

export function buildSystemContext(blocks: SequenceBlock[]): AIMessage {
  if (blocks.length === 0) {
    return {
      role: 'system',
      content:
        'You are a molecular biology assistant specializing in DNA/RNA sequence analysis, annotation, and genetic engineering. Help the user with sequence analysis, gene design, cloning strategies, and molecular biology questions.',
    };
  }

  const blockDescriptions = blocks.map((block, i) => {
    const preview =
      block.raw.length > 200 ? block.raw.slice(0, 200) + '...' : block.raw;
    const featureList =
      block.features.length > 0
        ? `\n    Features: ${block.features.map((f) => `${f.name} (${f.type}, ${f.start}-${f.end})`).join(', ')}`
        : '';
    const analysisInfo =
      block.analysis
        ? `\n    GC: ${(block.analysis.gcContent * 100).toFixed(1)}%, MW: ${block.analysis.molecularWeight.toFixed(0)} Da, Tm: ${block.analysis.meltingTemp?.toFixed(1) ?? 'N/A'}C, ORFs: ${block.analysis.orfs.length}`
        : '';

    return `  [Block ${i + 1}: "${block.name}"]
    Type: ${block.type}, Length: ${block.raw.length} bp, Topology: ${block.topology}${featureList}${analysisInfo}
    Sequence: ${preview}`;
  });

  return {
    role: 'system',
    content: `You are a molecular biology assistant specializing in DNA/RNA sequence analysis, annotation, and genetic engineering.

The user has the following sequences in their workspace:

${blockDescriptions.join('\n\n')}

Help the user analyze these sequences, identify features, design experiments, and answer molecular biology questions. Reference specific sequences by name when relevant.`,
  };
}
