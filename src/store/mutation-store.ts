import { create } from 'zustand';
import type { MutationOperation } from './types';

const MAX_HISTORY = 100;

interface MutationHistoryState {
  undoStacks: Record<string, MutationOperation[]>;  // blockId → stack
  redoStacks: Record<string, MutationOperation[]>;
}

interface MutationHistoryActions {
  pushOperation(op: MutationOperation): void;
  undo(blockId: string): MutationOperation | null;
  redo(blockId: string): MutationOperation | null;
  canUndo(blockId: string): boolean;
  canRedo(blockId: string): boolean;
  clearHistory(blockId: string): void;
}

export type MutationHistoryStore = MutationHistoryState & MutationHistoryActions;

export const useMutationHistoryStore = create<MutationHistoryStore>()((set, get) => ({
  // Initial state
  undoStacks: {},
  redoStacks: {},

  // Actions
  pushOperation: (op) => set((s) => {
    const blockId = op.blockId;
    const prevUndo = s.undoStacks[blockId] ?? [];
    const trimmed = [...prevUndo, op].slice(-MAX_HISTORY);
    return {
      undoStacks: { ...s.undoStacks, [blockId]: trimmed },
      redoStacks: { ...s.redoStacks, [blockId]: [] },
    };
  }),

  undo: (blockId) => {
    const { undoStacks, redoStacks } = get();
    const undoStack = undoStacks[blockId] ?? [];
    if (undoStack.length === 0) return null;

    const op = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);
    const newRedo = [...(redoStacks[blockId] ?? []), op];

    set({
      undoStacks: { ...undoStacks, [blockId]: newUndo },
      redoStacks: { ...redoStacks, [blockId]: newRedo },
    });

    return op;
  },

  redo: (blockId) => {
    const { undoStacks, redoStacks } = get();
    const redoStack = redoStacks[blockId] ?? [];
    if (redoStack.length === 0) return null;

    const op = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    const newUndo = [...(undoStacks[blockId] ?? []), op];

    set({
      undoStacks: { ...undoStacks, [blockId]: newUndo },
      redoStacks: { ...redoStacks, [blockId]: newRedo },
    });

    return op;
  },

  canUndo: (blockId) => {
    const { undoStacks } = get();
    return (undoStacks[blockId]?.length ?? 0) > 0;
  },

  canRedo: (blockId) => {
    const { redoStacks } = get();
    return (redoStacks[blockId]?.length ?? 0) > 0;
  },

  clearHistory: (blockId) => set((s) => ({
    undoStacks: { ...s.undoStacks, [blockId]: [] },
    redoStacks: { ...s.redoStacks, [blockId]: [] },
  })),
}));
