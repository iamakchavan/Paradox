import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import type { ModelConfig } from '@/lib/models';
import { getPerplexityModel } from '@/lib/perplexity';
import type { ChatRequestHeaders, ProviderKeys } from './types';

export function readChatRequestHeaders(req: Request): ChatRequestHeaders {
  return {
    providerKeys: {
      geminiKey: req.headers.get('x-api-key-gemini'),
      mistralKey: req.headers.get('x-api-key-mistral'),
      perplexityKey: req.headers.get('x-api-key-perplexity'),
      zenmuxKey: req.headers.get('x-api-key-zenmux'),
      inceptionKey: req.headers.get('x-api-key-inception'),
      nvidiaKey: req.headers.get('x-api-key-nvidia'),
    },
    searchKeys: {
      tavilyKey: req.headers.get('x-api-key-tavily'),
      exaKey: req.headers.get('x-api-key-exa'),
      firecrawlKey: req.headers.get('x-api-key-firecrawl'),
    },
    searchEnabled: req.headers.get('x-search-enabled') === 'true',
  };
}

export function createChatModel(config: ModelConfig, keys: ProviderKeys): any {
  const baseModel = (() => {
    if (config.provider === 'google') {
      if (!keys.geminiKey) throw new Error('Google Gemini API key is missing');
      return createGoogleGenerativeAI({ apiKey: keys.geminiKey })(config.id);
    }
    if (config.provider === 'mistral') {
      if (!keys.mistralKey) throw new Error('Mistral API key is missing');
      return createMistral({ apiKey: keys.mistralKey })(config.id);
    }
    if (config.provider === 'perplexity') {
      if (!keys.perplexityKey) throw new Error('Perplexity API key is missing');
      return getPerplexityModel(keys.perplexityKey, config.id, 'chat');
    }
    if (config.provider === 'zenmux') {
      if (!keys.zenmuxKey) throw new Error('ZenMux API key is missing');
      return createOpenAI({
        apiKey: keys.zenmuxKey,
        baseURL: 'https://zenmux.ai/api/v1',
      }).chat(config.id);
    }
    if (config.provider === 'inception') {
      if (!keys.inceptionKey) throw new Error('Inception Labs API key is missing');
      return createOpenAI({
        apiKey: keys.inceptionKey,
        baseURL: 'https://api.inceptionlabs.ai/v1',
      }).chat(config.id);
    }
    if (config.provider === 'nvidia') {
      if (!keys.nvidiaKey) throw new Error('NVIDIA API key is missing');
      return createOpenAI({
        apiKey: keys.nvidiaKey,
        baseURL: 'https://integrate.api.nvidia.com/v1',
      }).chat(config.id);
    }
    throw new Error(`Unsupported provider: ${config.provider}`);
  })();

  if (
    config.provider === 'nvidia' ||
    config.provider === 'zenmux' ||
    config.provider === 'inception' ||
    config.provider === 'perplexity'
  ) {
    return wrapLanguageModel({
      model: baseModel,
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  return baseModel;
}

export function buildProviderOptions(
  modelConfig: ModelConfig,
  model: string,
  canUseTools: boolean,
): Record<string, any> {
  const providerOptions: Record<string, any> = {};

  if (modelConfig.provider === 'google') {
    const isReasoningModel = model.includes('pro') || model.includes('3.1') || model.includes('3.5');
    providerOptions.google = {
      thinkingConfig: isReasoningModel
        ? {
            thinkingBudget: canUseTools ? 0 : 2048,
          }
        : undefined,
    };
  }

  if (modelConfig.provider === 'zenmux' || modelConfig.provider === 'nvidia') {
    const isReasoningModel =
      model.includes('glm-') ||
      model.includes('pro') ||
      model.includes('reasoning') ||
      model.includes('gpt-oss') ||
      model.includes('nemotron') ||
      model.includes('step-') ||
      model.includes('stepfun') ||
      model.includes('medium-3.5');

    let extraBody: Record<string, any> = {};
    if (model === 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning') {
      extraBody = {
        reasoning_budget: 16384,
        chat_template_kwargs: { enable_thinking: true },
      };
    } else if (model === 'nvidia/nvidia-nemotron-nano-9b-v2') {
      extraBody = {
        min_thinking_tokens: 1024,
        max_thinking_tokens: 2048,
      };
    } else if (model === 'mistralai/mistral-medium-3.5-128b') {
      extraBody = {
        reasoning_effort: 'high',
      };
    }

    providerOptions.openai = {
      parallelToolCalls: false,
      ...(isReasoningModel && modelConfig.provider === 'zenmux'
        ? {
            reasoningEffort: 'medium',
            reasoningSummary: 'detailed',
          }
        : {}),
      ...(Object.keys(extraBody).length > 0 ? { extraBody } : {}),
    };
  }

  return providerOptions;
}

