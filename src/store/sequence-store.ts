import { create } from 'zustand';
import type { SequenceBlock, MutationScar } from './types';
import type { SequenceType, Feature, ManipulationType, SequenceAnalysis } from '../bio/types';

interface SequenceState {
  blocks: SequenceBlock[];
}

interface SequenceActions {
  addBlock(conversationId: string, raw: string, name?: string): string;
  removeBlock(blockId: string): void;
  restoreBlock(block: SequenceBlock): void;
  updateBlockNotes(blockId: string, notes: string): void;
  updateBlockName(blockId: string, name: string): void;
  reorderBlocks(conversationId: string, blockIds: string[]): void;
  setBlockFeatures(blockId: string, features: Feature[]): void;
  addFeature(blockId: string, feature: Feature): void;
  updateFeature(blockId: string, featureId: string, updates: Partial<Feature>): void;
  removeFeature(blockId: string, featureId: string): void;
  setBlockAnalysis(blockId: string, analysis: SequenceAnalysis | null): void;
  setBlockParent(blockId: string, parentBlockId: string, manipulation: ManipulationType): void;
  updateBlockRaw(blockId: string, raw: string, scars: MutationScar[]): void;
  applyMutationSnapshot(blockId: string, raw: string, scars: MutationScar[], features: Feature[]): void;
  getConversationBlocks(conversationId: string): SequenceBlock[];
}

export type SequenceStore = SequenceState & SequenceActions;

function detectSequenceType(raw: string): SequenceType {
  const clean = raw.toUpperCase().replace(/[\s\d\n\r>]/g, '');
  if (clean.length === 0) return 'unknown';

  const dnaChars = new Set(['A', 'T', 'G', 'C', 'N']);
  const rnaChars = new Set(['A', 'U', 'G', 'C', 'N']);
  const proteinChars = new Set([
    'A','R','N','D','C','E','Q','G','H','I','L','K','M','F','P','S','T','W','Y','V','*',
  ]);

  let dnaCount = 0;
  let rnaCount = 0;
  let proteinCount = 0;
  let hasU = false;
  let hasT = false;

  for (const ch of clean) {
    if (dnaChars.has(ch)) dnaCount++;
    if (rnaChars.has(ch)) rnaCount++;
    if (proteinChars.has(ch)) proteinCount++;
    if (ch === 'U') hasU = true;
    if (ch === 'T') hasT = true;
  }

  const total = clean.length;
  if (dnaCount / total > 0.95 && !hasU) return 'dna';
  if (rnaCount / total > 0.95 && hasU && !hasT) return 'rna';
  if (proteinCount / total > 0.9) return 'protein';
  return 'unknown';
}

function generateBlockName(type: SequenceType, existingCount: number): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const num = String(existingCount + 1).padStart(3, '0');
  const prefix = type === 'unknown' ? 'SEQ' : type.toUpperCase();
  return `${prefix}_${dateStr}_${num}`;
}

export const useSequenceStore = create<SequenceStore>((set, get) => ({
  blocks: [],

  addBlock(conversationId, raw, name) {
    const id = crypto.randomUUID();
    const type = detectSequenceType(raw);
    const existingBlocks = get().blocks.filter((b) => b.conversationId === conversationId);
    const blockName = name || generateBlockName(type, existingBlocks.length);

    const block: SequenceBlock = {
      id,
      conversationId,
      name: blockName,
      notes: '',
      raw: raw.trim(),
      type,
      topology: 'linear',
      features: [],
      analysis: null,
      scars: [],
      parentBlockId: null,
      manipulation: null,
      position: existingBlocks.length,
      createdAt: Date.now(),
    };

    set((s) => ({ blocks: [...s.blocks, block] }));
    return id;
  },

  removeBlock(blockId) {
    set((s) => ({ blocks: s.blocks.filter((b) => b.id !== blockId) }));
  },

  restoreBlock(block) {
    set((s) => ({ blocks: [...s.blocks, block] }));
  },

  updateBlockNotes(blockId, notes) {
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, notes } : b)),
    }));
  },

  updateBlockName(blockId, name) {
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, name } : b)),
    }));
  },

  reorderBlocks(conversationId, blockIds) {
    set((s) => ({
      blocks: s.blocks.map((b) => {
        if (b.conversationId !== conversationId) return b;
        const idx = blockIds.indexOf(b.id);
        return idx >= 0 ? { ...b, position: idx } : b;
      }),
    }));
  },

  setBlockFeatures(blockId, features) {
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, features } : b)),
    }));
  },

  addFeature(blockId, feature) {
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === blockId ? { ...b, features: [...b.features, feature] } : b,
      ),
    }));
  },

  updateFeature(blockId, featureId, updates) {
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === blockId
          ? { ...b, features: b.features.map((f) => (f.id === featureId ? { ...f, ...updates } : f)) }
          : b,
      ),
    }));
  },

  removeFeature(blockId, featureId) {
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === blockId
          ? { ...b, features: b.features.filter((f) => f.id !== featureId) }
          : b,
      ),
    }));
  },

  setBlockAnalysis(blockId, analysis) {
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, analysis } : b)),
    }));
  },

  setBlockParent(blockId, parentBlockId, manipulation) {
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === blockId ? { ...b, parentBlockId, manipulation } : b,
      ),
    }));
  },

  updateBlockRaw(blockId, raw, scars) {
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, raw, scars } : b)),
    }));
  },

  applyMutationSnapshot(blockId, raw, scars, features) {
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === blockId ? { ...b, raw, scars, features } : b,
      ),
    }));
  },

  getConversationBlocks(conversationId) {
    return get()
      .blocks.filter((b) => b.conversationId === conversationId)
      .sort((a, b) => a.position - b.position);
  },
}));
