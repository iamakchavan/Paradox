"use client";

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { ChevronDown, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ApiKeys } from '@/hooks/use-api-keys';
import type { KeyField } from './AIProvidersTab';

const SEARCH_FIELDS: KeyField[] = [
  { key: 'tavilyApiKey',    storageKey: 'tavily-api-key',    label: 'Tavily',     placeholder: 'Enter Tavily API key',    href: 'https://tavily.com/' },
  { key: 'exaApiKey',       storageKey: 'exa-api-key',       label: 'Exa',        placeholder: 'Enter Exa API key',       href: 'https://dashboard.exa.ai/' },
  { key: 'firecrawlApiKey', storageKey: 'firecrawl-api-key', label: 'Firecrawl',  placeholder: 'Enter Firecrawl API key', href: 'https://www.firecrawl.dev/' },
];

const searchLogoMap: Record<string, { src: string; cls?: string }> = {
  tavilyApiKey:    { src: '/logo/tavily-color.svg' },
  exaApiKey:       { src: '/logo/exa-color.svg' },
  firecrawlApiKey: { src: '/logo/firecrawl-color.svg', cls: 'w-3 h-[18px]' },
};

interface Props {
  apiKeys: ApiKeys;
  inputKeys: Record<keyof ApiKeys, string>;
  setInputKeys: React.Dispatch<React.SetStateAction<Record<keyof ApiKeys, string>>>;
}

export function SearchScrapingTab({ apiKeys, inputKeys, setInputKeys }: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const toggleVisibility = (k: string) =>
    setVisibleFields(prev => ({ ...prev, [k]: !prev[k] }));

  return (
    <div className="space-y-2">
      <p className="text-[12px] font-medium text-foreground/45 px-0.5 pb-1">
        Search & Scrape Keys
      </p>

      <div className="bg-zinc-50/40 dark:bg-zinc-950/45 border border-zinc-200/40 dark:border-zinc-800/50 rounded-2xl divide-y divide-zinc-200/20 dark:divide-zinc-800/45 overflow-hidden shadow-sm">
        {SEARCH_FIELDS.map((field) => {
          const isExpanded = expandedKey === field.key;
          const hasValue = (inputKeys[field.key] || '').trim().length > 0;
          const logo = searchLogoMap[field.key];

          return (
            <div key={field.key} className="bg-zinc-100/5 dark:bg-zinc-950/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors duration-150">
              {/* Header row */}
              <button
                type="button"
                onClick={() => setExpandedKey(isExpanded ? null : field.key)}
                className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  {logo ? (
                    <img src={logo.src} className={`${logo.cls || 'w-3.5 h-3.5'} object-contain`} alt="" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full bg-foreground/20" />
                  )}
                  <span className="text-sm font-semibold text-foreground/90">{field.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasValue ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Configured
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-foreground/40 bg-foreground/5 px-2.5 py-0.5 rounded-full border border-border/30">
                      Not Set
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-foreground/40 transition-transform duration-200',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </div>
              </button>

              {/* Expandable input */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 space-y-2">
                      <div className="relative flex items-center bg-zinc-200/20 dark:bg-zinc-900/35 rounded-xl border border-zinc-200/30 dark:border-zinc-800/40 px-3.5 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 focus-within:ring-2 focus-within:ring-zinc-400/5 transition-all duration-200">
                        <Input
                          id={field.key}
                          type={visibleFields[field.key] ? 'text' : 'password'}
                          value={inputKeys[field.key]}
                          onChange={(e) =>
                            setInputKeys(prev => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={field.placeholder}
                          className="h-10 border-0 bg-transparent px-0 text-xs text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-foreground/35"
                        />
                        <button
                          type="button"
                          onClick={() => toggleVisibility(field.key)}
                          className="ml-2 text-foreground/40 hover:text-foreground transition-colors shrink-0"
                        >
                          {visibleFields[field.key]
                            ? <EyeOff className="w-4 h-4" />
                            : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {field.href && (
                        <div className="flex justify-end">
                          <a
                            href={field.href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5"
                          >
                            <span>Get {field.label} key</span>
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
    </div>
  );
}

export { SEARCH_FIELDS };
