import type { ModelConfig } from '@/lib/models';

function isOpenAIReasoningModel(model: string): boolean {
  return (
    model.includes('glm-') ||
    model.includes('pro') ||
    model.includes('reasoning') ||
    model.includes('gpt-oss') ||
    model.includes('nemotron') ||
    model.includes('step-') ||
    model.includes('stepfun') ||
    model.includes('medium-3.5')
  );
}

function buildExtraBody(model: string): Record<string, any> {
  if (model === 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning') {
    return {
      reasoning_budget: 16384,
      chat_template_kwargs: { enable_thinking: true },
    };
  }
  if (model === 'nvidia/nvidia-nemotron-nano-9b-v2') {
    return {
      min_thinking_tokens: 1024,
      max_thinking_tokens: 2048,
    };
  }
  if (model === 'mistralai/mistral-medium-3.5-128b') {
    return { reasoning_effort: 'high' };
  }
  return {};
}

function addOpenAIOptions(
  providerOptions: Record<string, any>,
  modelConfig: ModelConfig,
  model: string,
): void {
  if (modelConfig.provider !== 'zenmux' && modelConfig.provider !== 'nvidia') return;

  const extraBody = buildExtraBody(model);
  providerOptions.openai = {
    parallelToolCalls: false,
    ...(isOpenAIReasoningModel(model) && modelConfig.provider === 'zenmux'
      ? {
          reasoningEffort: 'medium',
          reasoningSummary: 'detailed',
        }
      : {}),
    ...(Object.keys(extraBody).length > 0 ? { extraBody } : {}),
  };
}

export function buildPlannerProviderOptions(
  modelConfig: ModelConfig,
  model: string,
): Record<string, any> {
  const providerOptions: Record<string, any> = {};
  if (modelConfig.provider === 'google') {
    providerOptions.google = {
      thinkingConfig: {
        thinkingBudget: 0,
        includeThoughts: false,
      },
    };
  }
  addOpenAIOptions(providerOptions, modelConfig, model);
  return providerOptions;
}

export function buildSynthesisProviderOptions(
  modelConfig: ModelConfig,
  model: string,
): Record<string, any> {
  const providerOptions: Record<string, any> = {};
  if (modelConfig.provider === 'google') {
    const isReasoningModel =
      model.includes('pro') || model.includes('3.1') || model.includes('3.5');
    providerOptions.google = {
      thinkingConfig: isReasoningModel ? { thinkingBudget: 2048 } : undefined,
    };
  }
  addOpenAIOptions(providerOptions, modelConfig, model);
  return providerOptions;
}

