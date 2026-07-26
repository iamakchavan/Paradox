"use client";

import { Cpu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export const DISPLAY_BRANDS = [
  'google',
  'google-deepmind',
  'openai',
  'anthropic',
  'deepseek',
  'mistral',
  'perplexity',
  'xai',
  'moonshot',
  'zhipu',
  'alibaba',
  'stepfun',
  'minimax',
  'microsoft',
  'sarvam',
  'bytedance',
  'nvidia',
  'inception',
] as const;

export function getLogicalBrand(modelId: string, provider: string) {
  const model = modelId.toLowerCase();
  const normalizedProvider = provider.toLowerCase();

  if (model.startsWith('perplexity/')) return 'perplexity';
  if (model.includes('gemma')) return 'google-deepmind';
  if (model.includes('gemini')) return 'google';
  if (model.includes('mistral') || model.includes('mixtral') || model.includes('pixtral') || model.includes('codestral')) return 'mistral';
  if (model.includes('deepseek')) return 'deepseek';
  if (model.includes('kimi') || model.includes('moonshot')) return 'moonshot';
  if (model.includes('glm') || model.includes('zhipu') || model.includes('z-ai') || model.includes('zai')) return 'zhipu';
  if (model.includes('stepfun') || model.includes('step')) return 'stepfun';
  if (model.includes('qwen') || model.includes('alibaba')) return 'alibaba';
  if (model.includes('openai') || model.includes('gpt')) return 'openai';
  if (model.includes('claude') || model.includes('anthropic')) return 'anthropic';
  if (model.includes('grok') || model.startsWith('xai/')) return 'xai';
  if (model.includes('minimax')) return 'minimax';
  if (model.includes('microsoft') || model.includes('phi')) return 'microsoft';
  if (model.includes('sarvam')) return 'sarvam';
  if (model.includes('bytedance') || model.includes('seed-oss')) return 'bytedance';
  if (model.includes('mercury')) return 'inception';

  if (normalizedProvider === 'perplexity') return 'perplexity';
  if (normalizedProvider === 'google') return 'google';
  if (normalizedProvider === 'mistral') return 'mistral';
  if (normalizedProvider === 'nvidia') return 'nvidia';
  if (normalizedProvider === 'zenmux') return 'zenmux';
  if (normalizedProvider === 'inception') return 'inception';
  if (normalizedProvider === 'xai') return 'xai';

  return provider;
}

export function getBrandLabel(brand: string) {
  if (brand === 'google') return 'Google';
  if (brand === 'google-deepmind') return 'Google DeepMind';
  if (brand === 'mistral') return 'Mistral';
  if (brand === 'perplexity') return 'Perplexity';
  if (brand === 'xai') return 'xAI';
  if (brand === 'zenmux') return 'ZenMux';
  if (brand === 'nvidia') return 'NVIDIA';
  if (brand === 'openai') return 'OpenAI';
  if (brand === 'anthropic') return 'Anthropic';
  if (brand === 'deepseek') return 'DeepSeek';
  if (brand === 'moonshot') return 'Moonshot AI';
  if (brand === 'zai' || brand === 'zhipu') return 'Zhipu';
  if (brand === 'alibaba') return 'Alibaba';
  if (brand === 'stepfun') return 'StepFun';
  if (brand === 'minimax') return 'MiniMax';
  if (brand === 'microsoft') return 'Microsoft';
  if (brand === 'sarvam') return 'Sarvam AI';
  if (brand === 'bytedance') return 'ByteDance';
  if (brand === 'inception') return 'Inception Labs';
  return brand;
}

export function getProviderLogoUrl(provider: string, modelId: string | undefined, isDark: boolean) {
  const normalizedProvider = provider.toLowerCase();
  const model = modelId?.toLowerCase() || '';

  if (model.includes('gemini')) return '/logo/gemini-color.svg';
  if (model.includes('gemma')) return '/logo/gemma-color.svg';
  if (model.includes('deepseek')) return '/logo/deepseek-color.svg';
  if (model.includes('kimi')) return isDark ? '/logo/kimi-color (dark).svg' : '/logo/kimi-color.svg';
  if (model.includes('zhipu')) return '/logo/zhipu-color.svg';
  if (model.includes('glm') || model.includes('z-ai') || model.includes('zai')) {
    return isDark ? '/logo/zai (dark).svg' : '/logo/zai.svg';
  }
  if (model.includes('moonshot')) return isDark ? '/logo/moonshot (dark).svg' : '/logo/moonshot.svg';
  if (model.includes('minimax')) return '/logo/minimax-color.svg';
  if (model.includes('grok')) return isDark ? '/logo/grok-dark.svg' : '/logo/grok.svg';
  if ((model.includes('xai') || model.startsWith('xai/')) && !model.includes('minimax')) {
    return isDark ? '/logo/xai (dark).svg' : '/logo/xai.svg';
  }
  if (model.includes('openai') || model.includes('gpt')) {
    return isDark ? '/logo/openai (dark).svg' : '/logo/openai.svg';
  }
  if (model.includes('stepfun') || model.includes('step')) return '/logo/stepfun-color.svg';
  if (model.includes('qwen')) return '/logo/qwen-color.svg';
  if (model.includes('alibaba')) return '/logo/alibaba-color.svg';
  if (model.includes('claude') || model.includes('anthropic')) return '/logo/claude-color.svg';
  if (model.includes('microsoft') || model.includes('phi')) return '/logo/microsoft-color.svg';
  if (model.includes('sarvam')) return isDark ? '/logo/sarvam-color (dark).svg' : '/logo/sarvam-color.svg';
  if (model.includes('bytedance') || model.includes('seed-oss')) return '/logo/bytedance-color.svg';
  if (model.includes('mistral') || model.includes('mixtral') || model.includes('pixtral') || model.includes('codestral')) return '/logo/mistral-color.svg';

  if (normalizedProvider === 'google') return '/logo/google-color.svg';
  if (normalizedProvider === 'google-deepmind') return '/logo/deepmind-color.svg';
  if (normalizedProvider === 'mistral') return '/logo/mistral-color.svg';
  if (normalizedProvider === 'perplexity') return '/logo/perplexity-color.svg';
  if (normalizedProvider === 'nvidia') return '/logo/nvidia-color.svg';
  if (normalizedProvider === 'zenmux') return isDark ? '/logo/zenmux (dark).svg' : '/logo/zenmux.svg';
  if (normalizedProvider === 'openai') return isDark ? '/logo/openai (dark).svg' : '/logo/openai.svg';
  if (normalizedProvider === 'cohere') return '/logo/cohere-color.svg';
  if (normalizedProvider === 'groq') return '/logo/groq.svg';
  if (normalizedProvider === 'copilot') return '/logo/copilot-color.svg';
  if (normalizedProvider === 'microsoft') return '/logo/microsoft-color.svg';
  if (normalizedProvider === 'sarvam') return isDark ? '/logo/sarvam-color (dark).svg' : '/logo/sarvam-color.svg';
  if (normalizedProvider === 'stepfun') return '/logo/stepfun-color.svg';
  if (normalizedProvider === 'alibaba' || normalizedProvider === 'qwen') return '/logo/alibaba-color.svg';
  if (normalizedProvider === 'anthropic' || normalizedProvider === 'claude') {
    return isDark ? '/logo/anthropic-dark.svg' : '/logo/anthropic.svg';
  }
  if (normalizedProvider === 'zhipu') return '/logo/zhipu-color.svg';
  if (normalizedProvider === 'zai') return isDark ? '/logo/zai (dark).svg' : '/logo/zai.svg';
  if (normalizedProvider === 'minimax') return '/logo/minimax-color.svg';
  if (normalizedProvider === 'deepseek') return '/logo/deepseek-color.svg';
  if (normalizedProvider === 'kimi' || normalizedProvider === 'moonshot') {
    return isDark ? '/logo/moonshot (dark).svg' : '/logo/moonshot.svg';
  }
  if (normalizedProvider === 'bytedance') return '/logo/bytedance-color.svg';
  if (normalizedProvider === 'inception') return isDark ? '/logo/inception (dark).svg' : '/logo/inception.svg';
  if (normalizedProvider === 'xai') return isDark ? '/logo/xai (dark).svg' : '/logo/xai.svg';

  return null;
}

export function ModelLogo({
  provider,
  modelId,
  className,
  size = 14,
}: {
  provider: string;
  modelId?: string;
  className?: string;
  size?: number;
}) {
  const { resolvedTheme } = useTheme();
  const url = getProviderLogoUrl(provider, modelId, resolvedTheme === 'dark');

  if (url) {
    return (
      <img
        src={url}
        alt={provider}
        width={size}
        height={size}
        className={cn('shrink-0 object-contain', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return <Cpu className={cn('text-zinc-400 dark:text-zinc-500 shrink-0', className)} style={{ width: size, height: size }} />;
}
