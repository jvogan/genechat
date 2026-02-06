import type { AIProvider, AIProviderRegistry } from './types';

class ProviderRegistryImpl implements AIProviderRegistry {
  providers: Record<string, AIProvider> = {};

  register(provider: AIProvider): void {
    this.providers[provider.name] = provider;
  }

  get(name: string): AIProvider | undefined {
    return this.providers[name];
  }

  list(): AIProvider[] {
    return Object.values(this.providers);
  }
}

export const providerRegistry = new ProviderRegistryImpl();
