"use client";
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Key, Eye, EyeOff,
  Sun, Moon, ExternalLink, Database, Cpu, ChevronDown, Grid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomToast } from '@/components/ui/custom-toast';
import { ApiKeys } from '@/hooks/use-api-keys';
import { motion, AnimatePresence } from 'framer-motion';
import { IntegrationsTab } from './integrations/IntegrationsTab';

interface SettingsPageContentProps {
  apiKeys: ApiKeys;
  updateKey: (keyName: keyof ApiKeys, value: string | null) => void;
  onClose: () => void;
  defaultTab?: TabType;
}

type TabType = 'ai-providers' | 'search-scraping' | 'appearance' | 'integrations';

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
  { key: 'zenmuxApiKey', storageKey: 'zenmux-api-key', label: 'ZenMux API Key', placeholder: 'Enter ZenMux API key', href: 'https://zenmux.ai/' },
  { key: 'nvidiaApiKey', storageKey: 'nvidia-api-key', label: 'NVIDIA Build API Key', placeholder: 'Enter NVIDIA Build API key', href: 'https://build.nvidia.com/' },
];

const SEARCH_FIELDS: KeyField[] = [
  { key: 'tavilyApiKey', storageKey: 'tavily-api-key', label: 'Tavily API Key (Search)', placeholder: 'Enter Tavily API key', href: 'https://tavily.com/' },
  { key: 'exaApiKey', storageKey: 'exa-api-key', label: 'Exa API Key (Search)', placeholder: 'Enter Exa API key', href: 'https://dashboard.exa.ai/' },
  { key: 'firecrawlApiKey', storageKey: 'firecrawl-api-key', label: 'Firecrawl API Key (Search/Scrape)', placeholder: 'Enter Firecrawl API key', href: 'https://www.firecrawl.dev/' },
];

export function SettingsPageContent({ apiKeys, updateKey, onClose, defaultTab }: SettingsPageContentProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { showToast } = useCustomToast();
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab || 'appearance');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [localDark, setLocalDark] = useState(resolvedTheme === 'dark');

  useEffect(() => {
    setLocalDark(resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const handleThemeToggle = (newVal: boolean) => {
    setLocalDark(newVal);
    setTimeout(() => {
      setTheme(newVal ? 'dark' : 'light');
    }, 150);
  };

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
    onClose();
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
    { id: 'integrations' as TabType, label: 'Apps & Tools', icon: Grid },
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
    <div className="bg-zinc-50/40 dark:bg-zinc-950/45 border border-zinc-200/40 dark:border-zinc-850 rounded-2xl divide-y divide-zinc-200/20 dark:divide-zinc-800/45 overflow-hidden shadow-sm">
      {fields.map((field) => {
        const isExpanded = expandedKey === field.key;
        const hasValue = (inputKeys[field.key] || '').trim().length > 0;
        
        return (
          <div key={field.key} className="bg-zinc-100/5 dark:bg-zinc-950/5 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors duration-150">
            {/* Header row (always visible) */}
            <button
              type="button"
              onClick={() => setExpandedKey(isExpanded ? null : field.key)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left select-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {getLogoElement(field.key, resolvedTheme === 'dark')}
                <span className="text-xs sm:text-sm font-semibold text-foreground/90">{field.label.replace(' Key', '')}</span>
              </div>
              <div className="flex items-center gap-2">
                {hasValue ? (
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">Configured</span>
                ) : (
                  <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/60 bg-zinc-550/10 px-2.5 py-0.5 rounded-full border border-border/30">Not Set</span>
                )}
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground/60 transition-transform duration-250", isExpanded && "transform rotate-180")} />
              </div>
            </button>
            
            {/* Expandable input panel */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-2.5">
                    <div className="relative flex items-center bg-zinc-200/20 dark:bg-zinc-900/35 rounded-xl border border-zinc-200/30 dark:border-zinc-800/40 px-3.5 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 focus-within:ring-2 focus-within:ring-zinc-400/5 transition-all duration-200">
                      <Input
                        id={field.key}
                        type={visibleFields[field.key] ? 'text' : 'password'}
                        value={inputKeys[field.key]}
                        onChange={(e) => setInputKeys(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="h-10 border-0 bg-transparent px-0 text-xs text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 w-full placeholder:text-muted-foreground/45"
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility(field.key)}
                        className="ml-2 text-muted-foreground/60 hover:text-foreground transition-colors shrink-0"
                      >
                        {visibleFields[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {field.href && (
                      <div className="flex justify-end px-0.5">
                        <a
                          href={field.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>Get {field.label.replace(' API Key', '')} key</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 flex flex-col h-full select-none">
      {/* Title Header */}
      <div className="flex-shrink-0 mb-6 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4 flex items-center justify-between">
        <div className="flex items-center">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground/80 mt-1 hidden md:block">Configure your API credentials, search credentials, and theme preferences.</p>
          </div>
        </div>

        {/* Mobile-only Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className="md:hidden px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all active:scale-[0.97]"
        >
          Save
        </button>
      </div>

      {/* Main double pane container */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 pb-6 overflow-hidden">

        {/* Desktop Sidebar Navigation / Mobile Apple Segmented Control */}
        <div className="flex-shrink-0 md:w-56 flex flex-row md:flex-col p-[3px] md:p-0 bg-zinc-200/60 dark:bg-zinc-900 md:bg-transparent md:dark:bg-transparent rounded-xl md:rounded-none md:border-r border-zinc-200/40 dark:border-zinc-800/40 md:pr-4 md:gap-1.5 gap-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center justify-center md:justify-start gap-2 px-3 py-1.5 md:px-3.5 md:py-2.5 rounded-lg md:rounded-xl text-center md:text-left transition-all duration-200 flex-1 md:flex-none text-xs md:text-sm font-medium",
                  isActive
                    ? "bg-white dark:bg-zinc-800 md:bg-zinc-100 md:dark:bg-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)] md:shadow-none border border-transparent md:border-zinc-200/50 md:dark:border-zinc-800/50 text-foreground font-semibold"
                    : "text-zinc-550 dark:text-zinc-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 md:hover:bg-black/[0.04] md:dark:hover:bg-white/[0.04]"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0 hidden md:block", isActive ? "text-cyan-600 dark:text-cyan-400" : "text-muted-foreground/75")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings details - Column container */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Scrollable content block */}
          <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
            <div className="space-y-6 pb-6">
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
                    <span>Choose Appearance Preferences</span>
                  </div>

                  <div className="bg-zinc-50/40 dark:bg-zinc-950/45 border border-zinc-200/40 dark:border-zinc-850 rounded-2xl divide-y divide-zinc-200/20 dark:divide-zinc-800/45 overflow-hidden shadow-sm">
                    {/* Dark Mode Toggle Row */}
                    <div className="flex items-center justify-between p-4 sm:p-5 bg-zinc-100/5 dark:bg-zinc-950/5 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors duration-150">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-200/40 dark:bg-zinc-900/60 text-muted-foreground/80 rounded-xl">
                          <Moon className="h-4.5 w-4.5 text-violet-500 dark:text-violet-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-semibold text-foreground">Dark Mode</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">Reduce eye strain in low-light environments</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleThemeToggle(!localDark)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          localDark ? "bg-cyan-600 dark:bg-cyan-500" : "bg-zinc-200 dark:bg-zinc-800"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            localDark ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-4 animate-fade-in h-full flex flex-col min-h-0">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase px-0.5 shrink-0">
                    <Grid className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>App Integrations Hub</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <IntegrationsTab />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action footer inside content pane - hidden on mobile (Save/Back are top-aligned), clean footer on desktop */}
          <div className="hidden md:flex items-center gap-3 relative bottom-auto left-auto translate-x-0 rounded-none border-0 shadow-none bg-transparent backdrop-blur-none p-0 justify-end pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 shrink-0">
            {activeTab === 'integrations' ? (
              <Button
                onClick={onClose}
                className="h-9 px-5 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-foreground dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm transition-all active:scale-[0.97]"
              >
                Close Settings
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-9 px-4 rounded-full text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 transition-all active:scale-[0.97]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="h-9 px-5 rounded-full text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-800/90 dark:hover:bg-cyan-700/90 shadow-sm transition-all active:scale-[0.97]"
                >
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
