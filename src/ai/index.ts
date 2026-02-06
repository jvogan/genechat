import { providerRegistry } from './provider-registry';
import { claudeProvider } from './providers/claude';
import { openaiProvider } from './providers/openai';
import { geminiProvider } from './providers/gemini';
import { kimiProvider } from './providers/kimi';

// Register all providers
providerRegistry.register(claudeProvider);
providerRegistry.register(openaiProvider);
providerRegistry.register(geminiProvider);
providerRegistry.register(kimiProvider);

export { providerRegistry } from './provider-registry';
export { buildSystemContext } from './context-builder';
export type { AIProvider, AIProviderConfig, AIMessage, AIStreamChunk } from './types';
