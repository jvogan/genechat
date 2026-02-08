// ===== AI Provider Types =====
// Shared interface for all BYOK AI providers.

export interface AIProviderConfig {
  apiKey: string;
  model: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
}

export interface AIProvider {
  name: string;
  sendMessage(
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk: (chunk: AIStreamChunk) => void,
    signal?: AbortSignal,
  ): Promise<string>;

  validateKey(config: AIProviderConfig): Promise<boolean>;
}

export interface AIProviderRegistry {
  providers: Record<string, AIProvider>;
  register(provider: AIProvider): void;
  get(name: string): AIProvider | undefined;
}
