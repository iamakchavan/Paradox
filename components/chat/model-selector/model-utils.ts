import type { ModelConfig } from '@/lib/models';
import type { ModelProviderKeys } from './types';

export function getModelSubtitle(model: ModelConfig) {
  const isFree = model.pricing.input.includes('$0.00') || model.pricing.input.toLowerCase().includes('free');
  if (isFree) {
    return `${model.contextWindow} • Free`;
  }
  const inputPrice = model.pricing.input.split(' ')[0];
  return `${model.contextWindow} • ${inputPrice} / 1M tokens`;
}

export function isModelUnavailable(model: ModelConfig, keys: ModelProviderKeys) {
  const providerKey = model.provider === 'google'
    ? keys.geminiApiKey
    : model.provider === 'mistral'
      ? keys.mistralApiKey
      : model.provider === 'perplexity'
        ? keys.perplexityApiKey
        : model.provider === 'nvidia'
          ? keys.nvidiaApiKey
          : model.provider === 'inception'
            ? keys.inceptionApiKey
            : keys.zenmuxApiKey;
  return !providerKey;
}
