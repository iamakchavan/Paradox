import type { ModelConfig } from '@/lib/models';

export type ModelSelectorAlign = 'top' | 'bottom';

export interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  isLoading: boolean;
  geminiApiKey: string | null;
  mistralApiKey: string | null;
  perplexityApiKey: string | null;
  zenmuxApiKey: string | null;
  nvidiaApiKey: string | null;
  inceptionApiKey: string | null;
  minimal?: boolean;
  align?: ModelSelectorAlign;
}

export interface ModelProviderKeys {
  geminiApiKey: string | null;
  mistralApiKey: string | null;
  perplexityApiKey: string | null;
  zenmuxApiKey: string | null;
  nvidiaApiKey: string | null;
  inceptionApiKey: string | null;
}

export type GroupedModels = Record<string, ModelConfig[]>;

export interface ModelDropdownPosition {
  left: number;
  top: number;
  width: number;
}
