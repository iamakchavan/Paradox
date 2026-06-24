"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Key, Eye, EyeOff, ArrowLeft,
  Sun, Moon, Monitor, ExternalLink, Database, Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomToast } from '@/components/ui/custom-toast';
import { ApiKeys } from '@/hooks/use-api-keys';

interface SettingsPageContentProps {
  apiKeys: ApiKeys;
  updateKey: (keyName: keyof ApiKeys, value: string | null) => void;
  onClose: () => void;
}

type TabType = 'ai-providers' | 'search-scraping' | 'appearance';

interface KeyField {
  key: keyof ApiKeys;
  storageKey: string;
  label: string;
  placeholder: string;
  href?: string;
}

const AI_FIELDS: KeyField[] = [
  { key: 'geminiApiKey', storageKey: 'gemini-api-key', label: 'Google Gemini API Key', placeholder: 'Enter Google Gemini API key', href: 'https://aistudio.google.com/' },
  { key: 'perplexityApiKey', storageKey: 'perplexity-api-key', label: 'Perplexity Sonar API Key', placeholder: 'Enter Perplexity API key', href: 'https://www.perplexity.ai/settings/api' },
  { key: 'mistralApiKey', storageKey: 'mistral-api-key', label: 'Mistral API Key', placeholder: 'Enter Mistral API key', href: 'https://console.mistral.ai/api-keys/' },
  { key: 'inceptionApiKey', storageKey: 'inception-api-key', label: 'Inception Labs API Key', placeholder: 'Enter Inception Labs API key', href: 'https://platform.inceptionlabs.ai/' },
  { key: 'zenmuxApiKey', storageKey: 'zenmux-api-key', label: 'ZenMux API Key', placeholder: 'Enter ZenMux API key', href: 'https://zenmux.app/' },
  { key: 'nvidiaApiKey', storageKey: 'nvidia-api-key', label: 'NVIDIA Build API Key', placeholder: 'Enter NVIDIA Build API key', href: 'https://build.nvidia.com/' },
];

const SEARCH_FIELDS: KeyField[] = [
  { key: 'tavilyApiKey', storageKey: 'tavily-api-key', label: 'Tavily API Key (Search)', placeholder: 'Enter Tavily API key', href: 'https://tavily.com/' },
  { key: 'exaApiKey', storageKey: 'exa-api-key', label: 'Exa API Key (Search)', placeholder: 'Enter Exa API key', href: 'https://dashboard.exa.ai/' },
  { key: 'firecrawlApiKey', storageKey: 'firecrawl-api-key', label: 'Firecrawl API Key (Search/Scrape)', placeholder: 'Enter Firecrawl API key', href: 'https://www.firecrawl.dev/' },
];

export function SettingsPageContent({ apiKeys, updateKey, onClose }: SettingsPageContentProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { showToast } = useCustomToast();
  const [activeTab, setActiveTab] = useState<TabType>('appearance');

  // Consolidate API keys into single state
  const [inputKeys, setInputKeys] = useState<Record<keyof ApiKeys, string>>({
    geminiApiKey: '',
    perplexityApiKey: '',
    mistralApiKey: '',
    inceptionApiKey: '',
    zenmuxApiKey: '',
    nvidiaApiKey: '',
    tavilyApiKey: '',
    exaApiKey: '',
    firecrawlApiKey: '',
  });

  // Password visibility states
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  // Synchronize key states on change/mount
  useEffect(() => {
    setInputKeys({
      geminiApiKey: apiKeys.geminiApiKey || '',
      perplexityApiKey: apiKeys.perplexityApiKey || '',
      mistralApiKey: apiKeys.mistralApiKey || '',
      inceptionApiKey: apiKeys.inceptionApiKey || '',
      zenmuxApiKey: apiKeys.zenmuxApiKey || '',
      nvidiaApiKey: apiKeys.nvidiaApiKey || '',
      tavilyApiKey: apiKeys.tavilyApiKey || '',
      exaApiKey: apiKeys.exaApiKey || '',
      firecrawlApiKey: apiKeys.firecrawlApiKey || '',
    });
  }, [apiKeys]);

  const toggleVisibility = (field: string) => {
    setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    const fieldsToSave = [...AI_FIELDS, ...SEARCH_FIELDS];

    fieldsToSave.forEach(({ key, storageKey }) => {
      const val = (inputKeys[key] || '').trim();
      if (val) {
        localStorage.setItem(storageKey, val);
        updateKey(key, val);
      } else {
        localStorage.removeItem(storageKey);
        updateKey(key, null);
      }
    });

    showToast({
      message: 'Your settings have been saved successfully.',
      title: 'Settings Saved',
      type: 'success',
      mode: 'capsule'
    });
  };

  const AppearanceIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M2 6C2 3.79086 3.79086 2 6 2C8.20914 2 10 3.79086 10 6V18C10 20.2091 8.20914 22 6 22C3.79086 22 2 20.2091 2 18V6Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 8.24268L13.3137 4.92902C14.8758 3.36692 17.4084 3.36692 18.9705 4.92902C20.5326 6.49112 20.5326 9.02378 18.9705 10.5859L9.3064 20.25" stroke="currentColor" strokeWidth="1.5" />
      <path opacity="0.5" d="M6 22L18 22C20.2091 22 22 20.2091 22 18C22 15.7909 20.2091 14 18 14L15.5 14" stroke="currentColor" strokeWidth="1.5" />
      <path opacity="0.5" d="M7 18C7 18.5523 6.55228 19 6 19C5.44772 19 5 18.5523 5 18C5 17.4477 5.44772 17 6 17C6.55228 17 7 17.4477 7 18Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );

  const navItems = [
    { id: 'appearance' as TabType, label: 'Appearance', icon: AppearanceIcon },
    { id: 'ai-providers' as TabType, label: 'AI Providers', icon: Key },
    { id: 'search-scraping' as TabType, label: 'Search & Scrape', icon: Database },
  ];

  const getLogoElement = (fieldKey: string, isDark: boolean) => {
    const logoMap: Record<string, { src: string | [string, string]; cls?: string }> = {
      geminiApiKey: { src: '/logo/google-color.svg' },
      perplexityApiKey: { src: '/logo/perplexity-color.svg' },
      mistralApiKey: { src: '/logo/mistral-color.svg' },
      nvidiaApiKey: { src: '/logo/nvidia-color.svg' },
      zenmuxApiKey: { src: ['/logo/zenmux.svg', '/logo/zenmux (dark).svg'] },
      inceptionApiKey: { src: ['/logo/inception.svg', '/logo/inception (dark).svg'] },
      tavilyApiKey: { src: '/logo/tavily-color.svg' },
      exaApiKey: { src: '/logo/exa-color.svg' },
      firecrawlApiKey: { src: '/logo/firecrawl-color.svg', cls: 'w-3 h-[18px]' },
    };
    const entry = logoMap[fieldKey];
    if (entry) {
      const src = Array.isArray(entry.src) ? (isDark ? entry.src[1] : entry.src[0]) : entry.src;
      return <img src={src} className={`${entry.cls || 'w-3.5 h-3.5'} object-contain`} alt="" />;
    }
    return <Cpu className="w-3.5 h-3.5 text-muted-foreground/60" />;
  };

  const renderKeyInputList = (fields: KeyField[]) => (
    <div className="bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl p-5 space-y-4 shadow-sm">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor={field.key} className="text-xs font-semibold text-foreground/85 flex items-center gap-2">
              {getLogoElement(field.key, resolvedTheme === 'dark')}
              <span>{field.label}</span>
            </label>
            {field.href && (
              <a
                href={field.href}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                <span>Get key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <div className="relative">
            <Input
              id={field.key}
              type={visibleFields[field.key] ? 'text' : 'password'}
              value={inputKeys[field.key]}
              onChange={(e) => setInputKeys(prev => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="h-10 rounded-xl border-zinc-200/80 dark:border-zinc-800/80 text-xs bg-background/50 pr-10 focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700"
            />
            <button
              type="button"
              onClick={() => toggleVisibility(field.key)}
              className="absolute right-3.5 top-3 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              {visibleFields[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-3 flex flex-col h-full select-none">
      {/* Back button */}
      <div className="flex-shrink-0 mb-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all group py-1.5 px-3 rounded-full hover:bg-secondary/40 border border-transparent hover:border-zinc-200/40 dark:hover:border-zinc-800/40"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Chat</span>
        </button>
      </div>

      {/* Title Header */}
      <div className="flex-shrink-0 mb-6 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-xs text-muted-foreground/80 mt-1">Configure your API credentials, search extensions, and theme preferences.</p>
      </div>

      {/* Main double pane container */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 pb-6 overflow-hidden">

        {/* Desktop Sidebar Navigation / Mobile Tab bar */}
        <div className="flex-shrink-0 md:w-56 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none border-b md:border-b-0 border-zinc-200/40 dark:border-zinc-800/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-200 flex-shrink-0 text-xs sm:text-sm font-medium",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground/75")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings details - Scrollable content block */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 no-scrollbar space-y-6">
          <div className="space-y-6">
            {activeTab === 'ai-providers' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase px-0.5">
                  <Key className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span>AI API Provider Keys</span>
                </div>
                {renderKeyInputList(AI_FIELDS)}
              </div>
            )}

            {activeTab === 'search-scraping' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase px-0.5">
                  <Database className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span>Search Extensions & Scrapers</span>
                </div>
                {renderKeyInputList(SEARCH_FIELDS)}
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase px-0.5">
                  <AppearanceIcon className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span>Choose Theme Preference</span>
                </div>

                <div className="bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl p-3 flex flex-col sm:flex-row gap-3 shadow-sm">
                  {/* Light theme card */}
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      "flex-1 p-4 rounded-xl flex flex-col items-center justify-center gap-2.5 border transition-all duration-200",
                      theme === 'light'
                        ? "bg-background border-zinc-400/50 dark:border-zinc-700/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-foreground font-semibold"
                        : "border-zinc-200/40 dark:border-zinc-800/40 text-muted-foreground hover:text-foreground hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40"
                    )}
                  >
                    <Sun className={cn("h-5 w-5", theme === 'light' ? "text-amber-500 animate-pulse" : "text-muted-foreground/80")} />
                    <span className="text-xs">Light Mode</span>
                  </button>

                  {/* Dark theme card */}
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "flex-1 p-4 rounded-xl flex flex-col items-center justify-center gap-2.5 border transition-all duration-200",
                      theme === 'dark'
                        ? "bg-background border-zinc-400/50 dark:border-zinc-700/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-foreground font-semibold"
                        : "border-zinc-200/40 dark:border-zinc-800/40 text-muted-foreground hover:text-foreground hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40"
                    )}
                  >
                    <Moon className={cn("h-5 w-5", theme === 'dark' ? "text-violet-400 animate-pulse" : "text-muted-foreground/80")} />
                    <span className="text-xs">Dark Mode</span>
                  </button>

                  {/* System theme card */}
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={cn(
                      "flex-1 p-4 rounded-xl flex flex-col items-center justify-center gap-2.5 border transition-all duration-200",
                      theme === 'system'
                        ? "bg-background border-zinc-400/50 dark:border-zinc-700/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-foreground font-semibold"
                        : "border-zinc-200/40 dark:border-zinc-800/40 text-muted-foreground hover:text-foreground hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40"
                    )}
                  >
                    <Monitor className={cn("h-5 w-5", theme === 'system' ? "text-cyan-500 animate-pulse" : "text-muted-foreground/80")} />
                    <span className="text-xs">System Default</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action footer inside content pane - sticky / clean bottom block */}
          {activeTab !== 'appearance' && (
            <div className="pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 flex items-center justify-end gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-10 px-5 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="h-10 px-6 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-800/90 dark:hover:bg-cyan-700/90 shadow-sm transition-all"
              >
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
