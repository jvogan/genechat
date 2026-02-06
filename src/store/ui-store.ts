import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { UIState, Theme, PanelView } from './types';

interface UIActions {
  toggleSidebar(): void;
  togglePanel(): void;
  toggleDrawer(): void;
  setTheme(theme: Theme): void;
  toggleTheme(): void;
  setSidebarWidth(w: number): void;
  setPanelWidth(w: number): void;
  setAiDrawerHeight(h: number): void;
  setPanelView(view: PanelView): void;
  setActiveConversation(id: string | null): void;
  selectSequenceBlock(id: string | null): void;
  selectFeature(id: string | null, source: 'workspace' | 'map' | null): void;
  setSelectedRange(range: { start: number; end: number } | null): void;
  setZoom(zoom: number): void;
  setSearchQuery(query: string): void;
  setSequenceColoring(enabled: boolean): void;
}

export type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(subscribeWithSelector((set) => ({
  // Initial state
  theme: 'light',
  sidebarOpen: true,
  sidebarWidth: 240,
  panelOpen: false,
  panelWidth: 420,
  panelView: 'plasmid',
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

  // Actions
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  toggleDrawer: () => set((s) => ({ aiDrawerOpen: !s.aiDrawerOpen })),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  setPanelWidth: (panelWidth) => set({ panelWidth }),
  setAiDrawerHeight: (aiDrawerHeight) => set({ aiDrawerHeight }),
  setPanelView: (panelView) => set({ panelView }),
  setActiveConversation: (id) => set({ activeConversationId: id, activeSequenceBlockId: null }),
  selectSequenceBlock: (id) => set({ activeSequenceBlockId: id }),
  selectFeature: (id, source) => set({ selectedFeatureId: id, selectionSource: source }),
  setSelectedRange: (range) => set({ selectedRange: range }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSequenceColoring: (sequenceColoringEnabled) => set({ sequenceColoringEnabled }),
})));
