import { createOpenAI } from '@ai-sdk/openai';
import { defaultSettingsMiddleware, wrapLanguageModel } from 'ai';
import type { AgentReasoningEffort } from './models';
import {
  createPerplexityAgentFetch,
  type PerplexityAgentContext,
} from './perplexity-agent';

interface PerplexityAgentOptions {
  reasoningEffort?: AgentReasoningEffort;
  searchEnabled?: boolean;
}

/**
 * Creates a Vercel AI SDK compatible LanguageModel instance for Perplexity.
 *
 * Third-party models are exposed through Perplexity's Responses-compatible
 * Agent API. The native Responses adapter owns message conversion, function
 * call streaming, and function result correlation. The fetch middleware only
 * adds Perplexity-specific search, reasoning, and preset fields.
 */
export function getPerplexityModel(
  perplexityKey: string,
  modelId: string,
  context: PerplexityAgentContext,
  agentOptions: PerplexityAgentOptions = {},
) {
  const isAgentModel = modelId.includes('/');

  if (isAgentModel) {
    const perplexityAgent = createOpenAI({
      name: 'perplexity-agent',
      apiKey: perplexityKey,
      baseURL: 'https://api.perplexity.ai/v1',
      fetch: createPerplexityAgentFetch({
        context,
        reasoningEffort: agentOptions.reasoningEffort,
        searchEnabled: agentOptions.searchEnabled,
      }),
    });

    return wrapLanguageModel({
      model: perplexityAgent.responses(modelId),
      middleware: defaultSettingsMiddleware({
        settings: {
          providerOptions: {
            openai: {
              // Perplexity's documented function loop resubmits complete
              // response items instead of relying on stored item references.
              store: false,
            },
          },
        },
      }),
    });
  }

  return createOpenAI({
    apiKey: perplexityKey,
    baseURL: 'https://api.perplexity.ai',
  }).chat(modelId);
}
