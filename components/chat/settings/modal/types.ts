import type { ApiKeys } from '@/hooks/use-api-keys';

export type SettingsTabId = 'appearance' | 'ai-providers' | 'search-scraping';

export interface SettingsTabDefinition {
  id: SettingsTabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type SettingsInputKeys = Record<keyof ApiKeys, string>;
