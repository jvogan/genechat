// ===== App State Types =====
// Shared across all store slices and components.

import type { SequenceType, Feature, ManipulationType, SequenceAnalysis } from '../bio/types';

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
  parentBlockId: string | null;  // if derived from manipulation
  manipulation: ManipulationType | null;
  position: number;        // order in conversation stack
  createdAt: number;
}

// ===== UI State =====
export type Theme = 'light' | 'dark';
export type PanelView = 'plasmid' | 'linear';

export interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarWidth: number;
  panelOpen: boolean;
  panelWidth: number;
  panelView: PanelView;
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
