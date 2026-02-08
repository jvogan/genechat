import type { AIProvider, AIProviderConfig, AIMessage, AIStreamChunk } from '../types';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

function toGeminiContents(messages: AIMessage[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

function getSystemInstruction(messages: AIMessage[]): { parts: { text: string }[] } | undefined {
  const sys = messages.find((m) => m.role === 'system');
  if (!sys) return undefined;
  return { parts: [{ text: sys.content }] };
}

export const geminiProvider: AIProvider = {
  name: 'gemini',

  async sendMessage(
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk: (chunk: AIStreamChunk) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const url = `${GEMINI_BASE_URL}/models/${config.model}:streamGenerateContent?alt=sse`;

    const body: Record<string, unknown> = {
      contents: toGeminiContents(messages),
    };
    const systemInstruction = getSystemInstruction(messages);
    if (systemInstruction) {
      body.systemInstruction = systemInstruction;
    }

    let fullContent = '';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.apiKey,
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${err}`);
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

          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullContent += text;
              onChunk({ content: text, done: false });
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
      const response = await fetch(`${GEMINI_BASE_URL}/models`, {
        headers: { 'x-goog-api-key': config.apiKey },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
