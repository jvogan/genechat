import { create } from 'zustand';
import type { BlockCheckpoint } from './types';
import { useSequenceStore } from './sequence-store';

interface CheckpointState {
  checkpoints: BlockCheckpoint[];
}

interface CheckpointActions {
  createCheckpoint(blockId: string, label?: string): string;
  restoreCheckpoint(checkpointId: string): void;
  deleteCheckpoint(checkpointId: string): void;
  getBlockCheckpoints(blockId: string): BlockCheckpoint[];
}

export const useCheckpointStore = create<CheckpointState & CheckpointActions>((set, get) => ({
  checkpoints: [],

  createCheckpoint(blockId, label) {
    const block = useSequenceStore.getState().blocks.find((b) => b.id === blockId);
    if (!block) return '';

    const id = crypto.randomUUID();
    const checkpoint: BlockCheckpoint = {
      id,
      blockId: block.id,
      conversationId: block.conversationId,
      label: label || new Date().toLocaleString(),
      timestamp: Date.now(),
      raw: block.raw,
      type: block.type,
      topology: block.topology,
      features: JSON.parse(JSON.stringify(block.features)),
      scars: JSON.parse(JSON.stringify(block.scars)),
    };

    set((s) => ({ checkpoints: [...s.checkpoints, checkpoint] }));
    return id;
  },

  restoreCheckpoint(checkpointId) {
    const checkpoint = get().checkpoints.find((c) => c.id === checkpointId);
    if (!checkpoint) return;

    useSequenceStore.getState().applyMutationSnapshot(
      checkpoint.blockId,
      checkpoint.raw,
      JSON.parse(JSON.stringify(checkpoint.scars)),
      JSON.parse(JSON.stringify(checkpoint.features)),
    );
  },

  deleteCheckpoint(checkpointId) {
    set((s) => ({
      checkpoints: s.checkpoints.filter((c) => c.id !== checkpointId),
    }));
  },

  getBlockCheckpoints(blockId) {
    return get()
      .checkpoints.filter((c) => c.blockId === blockId)
      .sort((a, b) => b.timestamp - a.timestamp);
  },
}));
