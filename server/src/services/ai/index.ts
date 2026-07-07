import type { AiProvider } from './AiProvider.js';
import { MockAiProvider } from './MockAiProvider.js';
import { AnthropicAiProvider } from './AnthropicAiProvider.js';
import { OpenAiProvider } from './OpenAiProvider.js';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

/**
 * Resolves the configured provider. Falls back to the mock provider (which
 * always works, no key required) if the selected provider is missing its key.
 */
function resolveProvider(): AiProvider {
  if (env.AI_PROVIDER === 'anthropic') {
    if (!env.ANTHROPIC_API_KEY) {
      logger.warn('AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is empty — using mock provider');
      return new MockAiProvider();
    }
    return new AnthropicAiProvider();
  }
  if (env.AI_PROVIDER === 'openai') {
    if (!env.OPENAI_API_KEY) {
      logger.warn('AI_PROVIDER=openai but OPENAI_API_KEY is empty — using mock provider');
      return new MockAiProvider();
    }
    return new OpenAiProvider();
  }
  return new MockAiProvider();
}

export const aiProvider: AiProvider = resolveProvider();
logger.info(`AI provider: ${aiProvider.name}`);
