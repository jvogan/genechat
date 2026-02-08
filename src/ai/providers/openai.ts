import type { AIProvider, AIProviderConfig, AIMessage, AIStreamChunk } from '../types';

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models';

export const openaiProvider: AIProvider = {
  name: 'openai',

  async sendMessage(
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk: (chunk: AIStreamChunk) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    let fullContent = '';
    try {
      const response = await fetch(OPENAI_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          stream: true,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal,
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${err}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            onChunk({ content: '', done: true });
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              onChunk({ content: delta, done: false });
            }
          } catch {
            // skip
          }
        }
      }

      onChunk({ content: '', done: true });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        onChunk({ content: '', done: true });
        return fullContent;
      }
      throw err;
    }
    return fullContent;
  },

  async validateKey(config: AIProviderConfig): Promise<boolean> {
    try {
      const response = await fetch(OPENAI_MODELS_URL, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
