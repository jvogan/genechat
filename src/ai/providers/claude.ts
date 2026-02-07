import type { AIProvider, AIProviderConfig, AIMessage, AIStreamChunk } from '../types';

function toClaudeMessages(messages: AIMessage[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
}

function getSystemPrompt(messages: AIMessage[]): string | undefined {
  const sys = messages.find((m) => m.role === 'system');
  return sys?.content;
}

export const claudeProvider: AIProvider = {
  name: 'claude',

  async sendMessage(
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk: (chunk: AIStreamChunk) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const systemPrompt = getSystemPrompt(messages);
    const body: Record<string, unknown> = {
      model: config.model,
      max_tokens: 4096,
      stream: true,
      messages: toClaudeMessages(messages),
    };
    if (systemPrompt) {
      body.system = systemPrompt;
    }

    let fullContent = '';
    try {
      const response = await fetch(config.baseUrl || 'https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Claude API error (${response.status}): ${err}`);
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
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullContent += parsed.delta.text;
              onChunk({ content: parsed.delta.text, done: false });
            }
            if (parsed.type === 'message_stop') {
              onChunk({ content: '', done: true });
            }
          } catch {
            // skip unparseable lines
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
      const response = await fetch(config.baseUrl || 'https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: config.model || 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
