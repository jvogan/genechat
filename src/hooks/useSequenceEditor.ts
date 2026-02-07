// ===== Inline Sequence Mutation Editor Hook =====
// Always-on editing: click positions cursor, type to mutate.

import { useCallback, useEffect } from 'react';
import { useUIStore } from '../store/ui-store';
import { useSequenceStore } from '../store/sequence-store';
import { useMutationHistoryStore } from '../store/mutation-store';
import { applySubstitution, applyInsertion, applyDeletion } from '../bio/mutate';
import type { MutationScar, MutationOperation } from '../store/types';
import type { Feature } from '../bio/types';

// Valid base characters per sequence type
const DNA_BASES = new Set('ATGCN'.split(''));
const RNA_BASES = new Set('AUGCN'.split(''));
const PROTEIN_AAS = new Set('ARNDCEQGHILKMFPSTWYV*'.split(''));

interface UseSequenceEditorArgs {
  blockId: string;
  raw: string;
  scars: MutationScar[];
  features: Feature[];
  sequenceType: 'dna' | 'rna' | 'protein' | 'misc' | 'unknown' | 'mixed';
  isActive: boolean;
  isLocked?: boolean;
}

interface UseSequenceEditorReturn {
  handleClick: (pos: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isEditing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  handleUndo: () => void;
  handleRedo: () => void;
  insertMode: boolean;
  toggleInsertMode: () => void;
}

export function useSequenceEditor({
  blockId,
  raw,
  scars,
  features,
  sequenceType,
  isActive,
  isLocked = false,
}: UseSequenceEditorArgs): UseSequenceEditorReturn {
  const editingBlockId = useUIStore((s) => s.editingBlockId);
  const cursorPos = useUIStore((s) => s.editCursorPosition);
  const insertMode = useUIStore((s) => s.editInsertMode);
  const activeBlockId = useUIStore((s) => s.activeSequenceBlockId);
  const selectedRange = useUIStore((s) => s.selectedRange);
  const setSelectedRange = useUIStore((s) => s.setSelectedRange);

  const isEditing = isActive && editingBlockId === blockId && activeBlockId === blockId;

  const activateEditing = useUIStore((s) => s.activateEditing);
  const deactivateEditing = useUIStore((s) => s.deactivateEditing);
  const setCursorPos = useUIStore((s) => s.setEditCursorPosition);
  const toggleInsertModeFn = useUIStore((s) => s.toggleInsertMode);

  const applySnapshot = useSequenceStore((s) => s.applyMutationSnapshot);

  const pushOp = useMutationHistoryStore((s) => s.pushOperation);
  const undoFn = useMutationHistoryStore((s) => s.undo);
  const redoFn = useMutationHistoryStore((s) => s.redo);

  // Select boolean values directly so zustand re-renders when stacks change
  const canUndo = useMutationHistoryStore((s) => (s.undoStacks[blockId]?.length ?? 0) > 0);
  const canRedo = useMutationHistoryStore((s) => (s.redoStacks[blockId]?.length ?? 0) > 0);

  // Valid key check
  const isValidBase = useCallback((key: string): boolean => {
    const upper = key.toUpperCase();
    if (sequenceType === 'dna') return DNA_BASES.has(upper);
    if (sequenceType === 'rna') return RNA_BASES.has(upper);
    if (sequenceType === 'protein') return PROTEIN_AAS.has(upper);
    return DNA_BASES.has(upper);
  }, [sequenceType]);

  // Create and push a mutation operation
  const pushMutation = useCallback((
    type: MutationOperation['type'],
    position: number,
    previousBases: string,
    newBases: string,
    rawAfter: string,
    scarsAfter: MutationScar[],
    featuresAfter: Feature[],
  ) => {
    const op: MutationOperation = {
      id: crypto.randomUUID(),
      blockId,
      type,
      position,
      previousBases,
      newBases,
      rawBefore: raw,
      scarsBefore: scars,
      featuresBefore: features,
      rawAfter,
      scarsAfter,
      featuresAfter,
      timestamp: Date.now(),
    };
    pushOp(op);
  }, [blockId, raw, scars, features, pushOp]);

  // Click handler — positions cursor (blocked when locked)
  const handleClick = useCallback((pos: number) => {
    if (!isActive || isLocked) return;
    activateEditing(blockId, pos);
  }, [isActive, isLocked, blockId, activateEditing]);

  // Undo handler
  const handleUndo = useCallback(() => {
    const op = undoFn(blockId);
    if (op) {
      applySnapshot(blockId, op.rawBefore, op.scarsBefore, op.featuresBefore);
      setCursorPos(Math.min(op.position, op.rawBefore.length - 1));
    }
  }, [blockId, undoFn, applySnapshot, setCursorPos]);

  // Redo handler
  const handleRedo = useCallback(() => {
    const op = redoFn(blockId);
    if (op) {
      applySnapshot(blockId, op.rawAfter, op.scarsAfter, op.featuresAfter);
      setCursorPos(Math.min(op.position, op.rawAfter.length - 1));
    }
  }, [blockId, redoFn, applySnapshot, setCursorPos]);

  // Keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isEditing || isLocked) return;

    const metaOrCtrl = e.metaKey || e.ctrlKey;

    // Undo: Cmd+Z
    if (metaOrCtrl && !e.shiftKey && e.key === 'z') {
      e.preventDefault();
      e.stopPropagation();
      handleUndo();
      return;
    }

    // Redo: Cmd+Shift+Z
    if (metaOrCtrl && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      e.stopPropagation();
      handleRedo();
      return;
    }

    // Escape: deactivate editing (clear cursor, block stays selected)
    if (e.key === 'Escape') {
      e.preventDefault();
      deactivateEditing();
      return;
    }

    // Toggle insert mode
    if (e.key === 'i' && !metaOrCtrl && !e.shiftKey && !e.altKey) {
      if (sequenceType !== 'protein') {
        e.preventDefault();
        toggleInsertModeFn();
        return;
      }
    }

    // Insert key as universal toggle
    if (e.key === 'Insert') {
      e.preventDefault();
      toggleInsertModeFn();
      return;
    }

    // Arrow keys
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (cursorPos > 0) setCursorPos(cursorPos - 1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (cursorPos < raw.length - 1) setCursorPos(cursorPos + 1);
      return;
    }

    // Backspace / Delete with range selection — delete entire selection
    if ((e.key === 'Backspace' || e.key === 'Delete') && selectedRange) {
      e.preventDefault();
      const { start, end } = selectedRange;
      const count = end - start;
      if (count <= 0 || raw.length - count < 1) return;

      const deletedBases = raw.slice(start, end);
      const result = applyDeletion(raw, scars, features, start, count);
      applySnapshot(blockId, result.raw, result.scars, result.features);
      pushMutation('deletion', start, deletedBases, '', result.raw, result.scars, result.features);

      setCursorPos(Math.min(start, result.raw.length - 1));
      setSelectedRange(null);
      return;
    }

    // Backspace: delete base before cursor
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (cursorPos <= 0 && raw.length <= 1) return;
      const deletePos = cursorPos > 0 ? cursorPos - 1 : 0;
      if (raw.length <= 1) return;

      const result = applyDeletion(raw, scars, features, deletePos, 1);
      applySnapshot(blockId, result.raw, result.scars, result.features);
      pushMutation('deletion', deletePos, raw[deletePos], '', result.raw, result.scars, result.features);

      const newPos = Math.max(0, deletePos);
      setCursorPos(Math.min(newPos, result.raw.length - 1));
      return;
    }

    // Delete key: delete base at cursor
    if (e.key === 'Delete') {
      e.preventDefault();
      if (cursorPos >= raw.length || raw.length <= 1) return;

      const result = applyDeletion(raw, scars, features, cursorPos, 1);
      applySnapshot(blockId, result.raw, result.scars, result.features);
      pushMutation('deletion', cursorPos, raw[cursorPos], '', result.raw, result.scars, result.features);

      setCursorPos(Math.min(cursorPos, result.raw.length - 1));
      return;
    }

    // Valid base input
    if (e.key.length === 1 && isValidBase(e.key) && !metaOrCtrl) {
      e.preventDefault();
      const base = e.key.toUpperCase();

      if (insertMode) {
        const result = applyInsertion(raw, scars, features, cursorPos, base);
        applySnapshot(blockId, result.raw, result.scars, result.features);
        pushMutation('insertion', cursorPos, '', base, result.raw, result.scars, result.features);
        setCursorPos(cursorPos + 1);
      } else {
        if (cursorPos >= raw.length) return;
        const result = applySubstitution(raw, scars, features, cursorPos, base);
        applySnapshot(blockId, result.raw, result.scars, result.features);
        pushMutation('substitution', cursorPos, raw[cursorPos], base, result.raw, result.scars, result.features);
        if (cursorPos < raw.length - 1) setCursorPos(cursorPos + 1);
      }
      return;
    }
  }, [
    isEditing, isLocked, blockId, raw, scars, features, cursorPos, insertMode,
    selectedRange, sequenceType, isValidBase,
    deactivateEditing, setCursorPos, setSelectedRange, toggleInsertModeFn,
    applySnapshot, pushMutation, handleUndo, handleRedo,
  ]);

  // Global keydown listener for Cmd+Z when in edit mode (prevent browser undo)
  useEffect(() => {
    if (!isEditing) return;

    const handler = (e: KeyboardEvent) => {
      const metaOrCtrl = e.metaKey || e.ctrlKey;
      if (metaOrCtrl && e.key === 'z') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handler, { capture: true });
    return () => document.removeEventListener('keydown', handler, { capture: true });
  }, [isEditing]);

  // Keyboard shortcuts: Cmd+C, Cmd+A, Cmd+V, Home, End
  useEffect(() => {
    if (!isActive) return;

    // Valid base filter for paste
    const validBases = sequenceType === 'rna' ? RNA_BASES
      : sequenceType === 'protein' ? PROTEIN_AAS
      : DNA_BASES;

    const handler = (e: KeyboardEvent) => {
      const metaOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd+C: copy selected range or entire sequence
      if (metaOrCtrl && e.key === 'c') {
        const sel = useUIStore.getState().selectedRange;
        const text = sel ? raw.slice(sel.start, sel.end) : raw;
        navigator.clipboard.writeText(text);
        e.preventDefault();
        return;
      }

      // Cmd+A: select all bases
      if (metaOrCtrl && e.key === 'a') {
        e.preventDefault();
        useUIStore.getState().setSelectedRange({ start: 0, end: raw.length });
        return;
      }

      // Cmd+V: paste bases at cursor
      if (metaOrCtrl && e.key === 'v' && isEditing && !isLocked) {
        e.preventDefault();
        navigator.clipboard.readText().then((text) => {
          const filtered = text.toUpperCase().split('').filter(c => validBases.has(c)).join('');
          if (filtered.length === 0) return;

          // Read fresh state
          const state = useUIStore.getState();
          const sel = state.selectedRange;
          const pos = state.editCursorPosition;

          let currentRaw = raw;
          let currentScars = scars;
          let currentFeatures = features;

          // If selection, delete range first
          if (sel) {
            const delCount = sel.end - sel.start;
            if (delCount > 0 && currentRaw.length - delCount >= 1) {
              const delResult = applyDeletion(currentRaw, currentScars, currentFeatures, sel.start, delCount);
              currentRaw = delResult.raw;
              currentScars = delResult.scars;
              currentFeatures = delResult.features;
            }
            // Insert at selection start
            const insResult = applyInsertion(currentRaw, currentScars, currentFeatures, sel.start - 1, filtered);
            applySnapshot(blockId, insResult.raw, insResult.scars, insResult.features);
            pushMutation('insertion', sel.start, sel ? raw.slice(sel.start, sel.end) : '', filtered, insResult.raw, insResult.scars, insResult.features);
            setCursorPos(Math.min(sel.start + filtered.length, insResult.raw.length - 1));
            state.setSelectedRange(null);
          } else {
            // Insert at cursor (pos is current base, insert before it = pos-1 for applyInsertion convention)
            const insResult = applyInsertion(currentRaw, currentScars, currentFeatures, pos - 1, filtered);
            applySnapshot(blockId, insResult.raw, insResult.scars, insResult.features);
            pushMutation('insertion', pos, '', filtered, insResult.raw, insResult.scars, insResult.features);
            setCursorPos(Math.min(pos + filtered.length, insResult.raw.length - 1));
          }
        });
        return;
      }

      // Home/End only when editing
      if (isEditing && e.key === 'Home') {
        e.preventDefault();
        setCursorPos(0);
        return;
      }
      if (isEditing && e.key === 'End') {
        e.preventDefault();
        setCursorPos(Math.max(0, raw.length - 1));
        return;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isActive, isEditing, isLocked, blockId, raw, scars, features, sequenceType, setCursorPos, applySnapshot, pushMutation]);

  return {
    handleClick,
    handleKeyDown,
    isEditing,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    insertMode,
    toggleInsertMode: toggleInsertModeFn,
  };
}
