import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AIState, AIProviderName, ChatMessage } from './types';

interface AIActions {
  setApiKey(provider: AIProviderName, key: string): void;
  setActiveModel(provider: AIProviderName, modelId: string): void;
  addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): void;
  updateLastAssistantMessage(content: string): void;
  clearChat(): void;
  setStreaming(streaming: boolean): void;
}

export type AIStoreType = AIState & AIActions;

export const useAIStore = create<AIStoreType>()(subscribeWithSelector((set) => ({
  activeProvider: 'claude',
  activeModel: 'claude-sonnet-4-5-20250929',
  apiKeys: {
    claude: '',
    openai: '',
    gemini: '',
    kimi: '',
  },
  chatMessages: [],
  isStreaming: false,

  setApiKey(provider, key) {
    set((s) => ({
      apiKeys: { ...s.apiKeys, [provider]: key },
    }));
  },

  setActiveModel(provider, modelId) {
    set({ activeProvider: provider, activeModel: modelId });
  },

  addMessage(message) {
    const full: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    set((s) => ({
      chatMessages: [...s.chatMessages, full],
    }));
  },

  updateLastAssistantMessage(content) {
    set((s) => {
      const msgs = [...s.chatMessages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content };
          break;
        }
      }
      return { chatMessages: msgs };
    });
  },

  clearChat() {
    set({ chatMessages: [] });
  },

  setStreaming(isStreaming) {
    set({ isStreaming });
  },
})));
