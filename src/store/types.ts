// ===== App State Types =====
// Shared across all store slices and components.

import type { SequenceType, Feature, ManipulationType, SequenceAnalysis } from '../bio/types';

// ===== Mutation Scars =====
export type MutationScarType = 'substitution' | 'insertion' | 'deletion';

export interface MutationScar {
  id: string;
  position: number;        // 0-indexed in current raw
  type: MutationScarType;
  original?: string;       // sub: old base; del: removed bases
  inserted?: string;       // ins: added bases
  createdAt: number;
}

export interface MutationOperation {
  id: string;
  blockId: string;
  type: MutationScarType;
  position: number;
  previousBases: string;
  newBases: string;
  rawBefore: string;
  scarsBefore: MutationScar[];
  featuresBefore: Feature[];
  rawAfter: string;
  scarsAfter: MutationScar[];
  featuresAfter: Feature[];
  timestamp: number;
}

// ===== Projects =====
export interface Project {
  id: string;
  name: string;
  color: string;
  conversationIds: string[];
  createdAt: number; // timestamp
  updatedAt: number;
}

// ===== Conversations =====
export interface Conversation {
  id: string;
  title: string;
  projectId: string | null;
  sequenceBlockIds: string[]; // ordered stack
  createdAt: number;
  updatedAt: number;
}

// ===== Sequence Blocks =====
export interface SequenceBlock {
  id: string;
  conversationId: string;
  name: string;            // auto-generated or user-provided
  notes: string;           // user's custom notes/labels
  raw: string;             // raw sequence string
  type: SequenceType;
  topology: 'linear' | 'circular';
  features: Feature[];
  analysis: SequenceAnalysis | null;
  scars: MutationScar[];
  parentBlockId: string | null;  // if derived from manipulation
  manipulation: ManipulationType | null;
  position: number;        // order in conversation stack
  createdAt: number;
}

// ===== Block Checkpoints =====
export interface BlockCheckpoint {
  id: string;
  blockId: string;
  conversationId: string;
  label: string;
  timestamp: number;
  raw: string;
  type: SequenceType;
  topology: 'linear' | 'circular';
  features: Feature[];
  scars: MutationScar[];
}

// ===== UI State =====
export type Theme = 'light' | 'dark';
export interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarWidth: number;
  aiDrawerOpen: boolean;
  aiDrawerHeight: number;
  activeConversationId: string | null;
  activeSequenceBlockId: string | null;
  selectedFeatureId: string | null;
  selectionSource: 'workspace' | 'map' | null;
  selectedRange: { start: number; end: number } | null;
  zoom: number;
  searchQuery: string;
  sequenceColoringEnabled: boolean;
  sequenceGrouping: number;       // 0 = none (default), 3, 6, 9, 10
  codonTable: 'ecoli' | 'human' | 'yeast';
  editingBlockId: string | null;   // null = no cursor active
  editCursorPosition: number;
  editInsertMode: boolean;        // false = substitute, true = insert
  translationFrame: 0 | 1 | 2;   // reading frame for translate action
  lockedBlockIds: Set<string>;    // blocks locked from editing
  sequenceSearchOpen: boolean;
  sequenceSearchQuery: string;
  sequenceSearchMatchIndex: number;
  shortcutLegendOpen: boolean;
  selectedBlockIds: Set<string>;
}

// ===== AI Actions =====
export type AIActionType = 'create_block' | 'add_features' | 'modify_sequence' | 'rename_block' | 'select_region';

export interface AIAction {
  action: AIActionType;
  name?: string;
  sequence?: string;
  type?: string;
  topology?: string;
  features?: Feature[];
  blockName?: string;
  newName?: string;
  start?: number;
  end?: number;
}

export interface ActionResult {
  success: boolean;
  description: string;
  error?: string;
}

// ===== AI State =====
export type AIProviderName = 'claude' | 'openai' | 'gemini' | 'kimi';

export interface AIModelConfig {
  provider: AIProviderName;
  modelId: string;
  displayName: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sequenceContext: string[] | null; // block IDs referenced
  timestamp: number;
  model: string;
}

export interface AIState {
  activeProvider: AIProviderName;
  activeModel: string;
  apiKeys: Record<AIProviderName, string>;
  persistApiKeys: boolean;
  chatMessages: ChatMessage[];
  isStreaming: boolean;
}

// ===== Available AI Models =====
export const AI_MODELS: AIModelConfig[] = [
  // Claude
  { provider: 'claude', modelId: 'claude-opus-4-6', displayName: 'Claude Opus 4.6' },
  { provider: 'claude', modelId: 'claude-sonnet-4-5-20250929', displayName: 'Claude Sonnet 4.5' },
  { provider: 'claude', modelId: 'claude-haiku-4-5-20251001', displayName: 'Claude Haiku 4.5' },
  // OpenAI
  { provider: 'openai', modelId: 'gpt-5.2', displayName: 'GPT-5.2' },
  { provider: 'openai', modelId: 'gpt-5.2-mini', displayName: 'GPT-5.2 Mini' },
  // Gemini
  { provider: 'gemini', modelId: 'gemini-3-pro-preview', displayName: 'Gemini 3 Pro' },
  { provider: 'gemini', modelId: 'gemini-3-flash-preview', displayName: 'Gemini 3 Flash' },
  // Kimi
  { provider: 'kimi', modelId: 'kimi-k2.5', displayName: 'Kimi K2.5' },
];
