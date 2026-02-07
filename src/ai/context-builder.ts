import type { SequenceBlock } from '../store/types';
import type { AIMessage } from './types';

export interface WorkspaceContext {
  selectedRange: { start: number; end: number } | null;
  activeBlockId: string | null;
  activeBlockName: string | null;
}

export function buildSystemContext(blocks: SequenceBlock[], workspace?: WorkspaceContext): AIMessage {
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

  // Build current focus section
  let focusSection = '';
  if (workspace) {
    if (workspace.activeBlockName) {
      focusSection += `\n## Current Focus\n  Active block: "${workspace.activeBlockName}"`;
      if (workspace.selectedRange) {
        focusSection += `\n  Selected region: bases ${workspace.selectedRange.start + 1}-${workspace.selectedRange.end}`;
      }
    }
  }

  return {
    role: 'system',
    content: `You are a molecular biology assistant specializing in DNA/RNA sequence analysis, annotation, and genetic engineering.

The user has the following sequences in their workspace:

${blockDescriptions.join('\n\n')}${focusSection}

Help the user analyze these sequences, identify features, design experiments, and answer molecular biology questions. Reference specific sequences by name when relevant.

When the user has a selection, consider: what reading frame is it in? Are there internal restriction sites? What are good next steps for their workflow?

## Workspace Actions

You can modify the user's workspace by including action blocks in your response. Wrap each action in ~~~action fences with a JSON object.

Available actions:

1. **create_block** — Create a new sequence block
   Fields: name (string), sequence (string), type ("dna"|"rna"|"protein"), topology? ("linear"|"circular"), features? (array)
   Example:
   ~~~action
   {"action":"create_block","name":"RC of eGFP","sequence":"TTACTTGTACAGCTCGTC...","type":"dna"}
   ~~~

2. **add_features** — Add annotations to an existing block
   Fields: blockName (string, matches existing block name), features (array of {id, name, type, start, end, strand, color, metadata})
   Example:
   ~~~action
   {"action":"add_features","blockName":"eGFP","features":[{"id":"f1","name":"Start Codon","type":"cds","start":0,"end":3,"strand":1,"color":"#22d3ee","metadata":{}}]}
   ~~~

3. **modify_sequence** — Replace the sequence of an existing block
   Fields: blockName (string), sequence (string)

4. **rename_block** — Rename an existing block
   Fields: blockName (string, current name), newName (string)

5. **select_region** — Highlight a region in a block so the user can see what you're referring to
   Fields: blockName (string), start (number, 0-indexed), end (number, exclusive)
   Example:
   ~~~action
   {"action":"select_region","blockName":"eGFP","start":0,"end":3}
   ~~~

When the user asks you to create, modify, rename, annotate, or highlight sequences, include the appropriate action block(s) in your response along with your explanation. Each action will be auto-executed.`,
  };
}
