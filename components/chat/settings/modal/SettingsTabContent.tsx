import type { ApiKeys } from '@/hooks/use-api-keys';
import { AppearanceTab } from '../tabs/AppearanceTab';
import { AIProvidersTab } from '../tabs/AIProvidersTab';
import { SearchScrapingTab } from '../tabs/SearchScrapingTab';
import type { SettingsInputKeys, SettingsTabId } from './types';

export function SettingsTabContent({
  activeTab,
  apiKeys,
  inputKeys,
  setInputKeys,
}: {
  activeTab: SettingsTabId;
  apiKeys: ApiKeys;
  inputKeys: SettingsInputKeys;
  setInputKeys: React.Dispatch<React.SetStateAction<SettingsInputKeys>>;
}) {
  switch (activeTab) {
    case 'appearance':
      return <AppearanceTab />;
    case 'ai-providers':
      return <AIProvidersTab apiKeys={apiKeys} inputKeys={inputKeys} setInputKeys={setInputKeys} />;
    case 'search-scraping':
      return <SearchScrapingTab apiKeys={apiKeys} inputKeys={inputKeys} setInputKeys={setInputKeys} />;
  }
}
