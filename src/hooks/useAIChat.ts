import { useCallback } from 'react';
import { useAIStore } from '../store/ai-store';
import { useSequenceStore } from '../store/sequence-store';
import { useUIStore } from '../store/ui-store';
import { providerRegistry } from '../ai/provider-registry';
import { buildSystemContext } from '../ai/context-builder';
import type { AIMessage } from '../ai/types';

export function useAIChat() {
  const activeProvider = useAIStore((s) => s.activeProvider);
  const activeModel = useAIStore((s) => s.activeModel);
  const apiKeys = useAIStore((s) => s.apiKeys);
  const chatMessages = useAIStore((s) => s.chatMessages);
  const isStreaming = useAIStore((s) => s.isStreaming);
  const addMessage = useAIStore((s) => s.addMessage);
  const updateLastAssistantMessage = useAIStore((s) => s.updateLastAssistantMessage);
  const setStreaming = useAIStore((s) => s.setStreaming);
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const getConversationBlocks = useSequenceStore((s) => s.getConversationBlocks);

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message first so it always appears
      addMessage({
        role: 'user',
        content,
        sequenceContext: null,
        model: activeModel,
      });

      const provider = providerRegistry.get(activeProvider);
      if (!provider) {
        addMessage({
          role: 'assistant',
          content: `Provider "${activeProvider}" is not available. Please select a different model.`,
          sequenceContext: null,
          model: activeModel,
        });
        return;
      }

      const apiKey = apiKeys[activeProvider];
      if (!apiKey) {
        addMessage({
          role: 'assistant',
          content: `No API key set for ${activeProvider}. Open the settings (gear icon) to add your API key.`,
          sequenceContext: null,
          model: activeModel,
        });
        return;
      }

      // Build context from workspace sequences
      const blocks = activeConversationId
        ? getConversationBlocks(activeConversationId)
        : [];
      const systemMessage = buildSystemContext(blocks);

      // Build message history
      const history: AIMessage[] = [
        systemMessage,
        ...chatMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content },
      ];

      // Add empty assistant message for streaming
      addMessage({
        role: 'assistant',
        content: '',
        sequenceContext: null,
        model: activeModel,
      });

      setStreaming(true);
      let accumulated = '';

      try {
        await provider.sendMessage(
          history,
          { apiKey, model: activeModel },
          (chunk) => {
            if (chunk.content) {
              accumulated += chunk.content;
              updateLastAssistantMessage(accumulated);
            }
          },
        );
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Unknown error occurred';
        updateLastAssistantMessage(`Error: ${errorMsg}`);
      } finally {
        setStreaming(false);
      }
    },
    [
      activeProvider,
      activeModel,
      apiKeys,
      chatMessages,
      activeConversationId,
      getConversationBlocks,
      addMessage,
      updateLastAssistantMessage,
      setStreaming,
    ],
  );

  return {
    messages: chatMessages,
    isStreaming,
    sendMessage,
    clearChat: useAIStore.getState().clearChat,
  };
}
