import type { ProviderId } from '@/types';
import { createOpenAIClient, type LLMClient } from './providers/openai';

export type { LLMClient };

// Provider factory functions
const providers: Record<ProviderId, ((apiKey: string) => LLMClient) | null> = {
  openai: createOpenAIClient,
  anthropic: null, // To be implemented
  google: null, // To be implemented
};

export function createLLMClient(provider: ProviderId, apiKey: string): LLMClient {
  const factory = providers[provider];
  if (!factory) {
    throw new Error(`Provider ${provider} is not yet implemented`);
  }
  return factory(apiKey);
}

export function isProviderSupported(provider: ProviderId): boolean {
  return providers[provider] !== null;
}

export function getSupportedProviders(): ProviderId[] {
  return (Object.keys(providers) as ProviderId[]).filter(
    (p) => providers[p] !== null
  );
}

export { buildSystemPrompt } from './frameworks';
