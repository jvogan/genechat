import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { UIState, Theme } from './types';

interface UIActions {
  toggleSidebar(): void;
  toggleDrawer(): void;
  setTheme(theme: Theme): void;
  toggleTheme(): void;
  setSidebarWidth(w: number): void;
  setAiDrawerHeight(h: number): void;
  setActiveConversation(id: string | null): void;
  selectSequenceBlock(id: string | null): void;
  selectFeature(id: string | null, source: 'workspace' | 'map' | null): void;
  setSelectedRange(range: { start: number; end: number } | null): void;
  setZoom(zoom: number): void;
  setSearchQuery(query: string): void;
  setSequenceColoring(enabled: boolean): void;
  setSequenceGrouping(n: number): void;
  setCodonTable(table: 'ecoli' | 'human' | 'yeast'): void;
  activateEditing(blockId: string, pos: number): void;
  deactivateEditing(): void;
  setEditCursorPosition(pos: number): void;
  toggleInsertMode(): void;
  setTranslationFrame(frame: 0 | 1 | 2): void;
  toggleBlockLock(blockId: string): void;
  openSequenceSearch(): void;
  closeSequenceSearch(): void;
  setSequenceSearchQuery(query: string): void;
  setSequenceSearchMatchIndex(index: number): void;
  toggleShortcutLegend(): void;
  toggleBlockSelection(id: string): void;
  clearBlockSelection(): void;
  selectAllBlocks(ids: string[]): void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(subscribeWithSelector((set) => ({
  // Initial state
  theme: 'light',
  sidebarOpen: true,
  sidebarWidth: 240,
  aiDrawerOpen: false,
  aiDrawerHeight: 320,
  activeConversationId: null,
  activeSequenceBlockId: null,
  selectedFeatureId: null,
  selectionSource: null,
  selectedRange: null,
  zoom: 1,
  searchQuery: '',
  sequenceColoringEnabled: false,
  sequenceGrouping: 0,
  codonTable: 'ecoli',
  editingBlockId: null,
  editCursorPosition: 0,
  editInsertMode: true,
  translationFrame: 0,
  lockedBlockIds: new Set<string>(),
  sequenceSearchOpen: false,
  sequenceSearchQuery: '',
  sequenceSearchMatchIndex: 0,
  shortcutLegendOpen: false,
  selectedBlockIds: new Set<string>(),

  // Actions
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleDrawer: () => set((s) => ({ aiDrawerOpen: !s.aiDrawerOpen })),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  setAiDrawerHeight: (aiDrawerHeight) => set({ aiDrawerHeight }),
  setActiveConversation: (id) => set({ activeConversationId: id, activeSequenceBlockId: null, editingBlockId: null, selectedBlockIds: new Set<string>() }),
  selectSequenceBlock: (id) => set((s) => ({
    activeSequenceBlockId: id,
    selectedRange: id !== s.activeSequenceBlockId ? null : s.selectedRange,
    editingBlockId: id,
    editCursorPosition: id !== s.activeSequenceBlockId ? 0 : s.editCursorPosition,
  })),
  selectFeature: (id, source) => set({ selectedFeatureId: id, selectionSource: source }),
  setSelectedRange: (range) => set({ selectedRange: range }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSequenceColoring: (sequenceColoringEnabled) => set({ sequenceColoringEnabled }),
  setSequenceGrouping: (sequenceGrouping) => set({ sequenceGrouping }),
  setCodonTable: (codonTable) => set({ codonTable }),
  activateEditing: (blockId, pos) => set({ editingBlockId: blockId, editCursorPosition: pos, editInsertMode: true, selectedRange: null }),
  deactivateEditing: () => set({ editingBlockId: null, editCursorPosition: 0, editInsertMode: true }),
  setEditCursorPosition: (pos) => set({ editCursorPosition: pos }),
  toggleInsertMode: () => set((s) => ({ editInsertMode: !s.editInsertMode })),
  setTranslationFrame: (translationFrame) => set({ translationFrame }),
  openSequenceSearch: () => set({ sequenceSearchOpen: true }),
  closeSequenceSearch: () => set({ sequenceSearchOpen: false, sequenceSearchQuery: '', sequenceSearchMatchIndex: 0 }),
  setSequenceSearchQuery: (sequenceSearchQuery) => set({ sequenceSearchQuery, sequenceSearchMatchIndex: 0 }),
  setSequenceSearchMatchIndex: (sequenceSearchMatchIndex) => set({ sequenceSearchMatchIndex }),
  toggleShortcutLegend: () => set((s) => ({ shortcutLegendOpen: !s.shortcutLegendOpen })),
  toggleBlockLock: (blockId) => set((s) => {
    const next = new Set(s.lockedBlockIds);
    if (next.has(blockId)) next.delete(blockId); else next.add(blockId);
    return { lockedBlockIds: next };
  }),
  toggleBlockSelection: (id) => set((s) => {
    const next = new Set(s.selectedBlockIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { selectedBlockIds: next };
  }),
  clearBlockSelection: () => set({ selectedBlockIds: new Set<string>() }),
  selectAllBlocks: (ids) => set({ selectedBlockIds: new Set(ids) }),
})));
