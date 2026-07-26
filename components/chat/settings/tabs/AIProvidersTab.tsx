"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ChevronDown, Eye, EyeOff, ExternalLink, Cpu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ApiKeys } from '@/hooks/use-api-keys';

interface KeyField {
  key: keyof ApiKeys;
  storageKey: string;
  label: string;
  placeholder: string;
  href?: string;
}

const AI_FIELDS: KeyField[] = [
  { key: 'geminiApiKey',      storageKey: 'gemini-api-key',     label: 'Google Gemini',    placeholder: 'Enter Google Gemini API key',    href: 'https://aistudio.google.com/' },
  { key: 'perplexityApiKey',  storageKey: 'perplexity-api-key', label: 'Perplexity Sonar', placeholder: 'Enter Perplexity API key',        href: 'https://www.perplexity.ai/settings/api' },
  { key: 'mistralApiKey',     storageKey: 'mistral-api-key',    label: 'Mistral',          placeholder: 'Enter Mistral API key',           href: 'https://console.mistral.ai/api-keys/' },
  { key: 'inceptionApiKey',   storageKey: 'inception-api-key',  label: 'Inception Labs',   placeholder: 'Enter Inception Labs API key',    href: 'https://platform.inceptionlabs.ai/' },
  { key: 'zenmuxApiKey',      storageKey: 'zenmux-api-key',     label: 'ZenMux',           placeholder: 'Enter ZenMux API key',            href: 'https://zenmux.ai/' },
  { key: 'nvidiaApiKey',      storageKey: 'nvidia-api-key',     label: 'NVIDIA Build',     placeholder: 'Enter NVIDIA Build API key',      href: 'https://build.nvidia.com/' },
];

interface Props {
  apiKeys: ApiKeys;
  inputKeys: Record<keyof ApiKeys, string>;
  setInputKeys: React.Dispatch<React.SetStateAction<Record<keyof ApiKeys, string>>>;
}

const logoMap: Record<string, { src: string | [string, string]; cls?: string }> = {
  geminiApiKey:     { src: '/logo/google-color.svg' },
  perplexityApiKey: { src: '/logo/perplexity-color.svg' },
  mistralApiKey:    { src: '/logo/mistral-color.svg' },
  nvidiaApiKey:     { src: '/logo/nvidia-color.svg' },
  zenmuxApiKey:     { src: ['/logo/zenmux.svg', '/logo/zenmux (dark).svg'] },
  inceptionApiKey:  { src: ['/logo/inception.svg', '/logo/inception (dark).svg'] },
};

function ProviderLogo({ fieldKey, isDark }: { fieldKey: string; isDark: boolean }) {
  const entry = logoMap[fieldKey];
  if (!entry) return <Cpu className="w-3.5 h-3.5 text-foreground/40" />;
  const src = Array.isArray(entry.src) ? (isDark ? entry.src[1] : entry.src[0]) : entry.src;
  return <img src={src} className={`${entry.cls || 'w-3.5 h-3.5'} object-contain`} alt="" />;
}

export function AIProvidersTab({ apiKeys, inputKeys, setInputKeys }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const toggleVisibility = (k: string) =>
    setVisibleFields(prev => ({ ...prev, [k]: !prev[k] }));

  return (
    <section>
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">Model provider keys</h3>
        <p className="mt-1 text-[11px] leading-4 text-zinc-400 dark:text-zinc-600">Keys are stored locally in this browser and used only for your requests.</p>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-zinc-200/70 bg-zinc-50/30 divide-y divide-zinc-200/60 dark:border-white/[0.08] dark:bg-white/[0.02] dark:divide-white/[0.06]">
        {AI_FIELDS.map((field) => {
          const isExpanded = expandedKey === field.key;
          const hasValue = (inputKeys[field.key] || '').trim().length > 0;

          return (
            <div key={field.key} className={cn('transition-colors duration-150', isExpanded ? 'bg-white dark:bg-white/[0.025]' : 'hover:bg-zinc-100/60 dark:hover:bg-white/[0.025]')}>
              {/* Header row */}
              <button
                type="button"
                onClick={() => setExpandedKey(isExpanded ? null : field.key)}
                className="flex min-h-[54px] w-full items-center justify-between px-4 py-3 text-left cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center">
                    <ProviderLogo fieldKey={field.key} isDark={isDark} />
                  </span>
                  <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{field.label}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  {hasValue ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Configured
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-600">
                      Not set
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 dark:text-zinc-600',
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
                    <div className="space-y-2 px-4 pb-4 pl-14">
                      <div className="relative flex items-center rounded-[10px] border border-zinc-200/80 bg-zinc-50/70 px-3.5 transition-[border-color,box-shadow] duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] focus-within:border-zinc-300 focus-within:ring-2 focus-within:ring-zinc-950/[0.03] dark:border-white/[0.08] dark:bg-black/20 dark:focus-within:border-white/[0.14] dark:focus-within:ring-white/[0.03]">
                        <Input
                          id={field.key}
                          type={visibleFields[field.key] ? 'text' : 'password'}
                          value={inputKeys[field.key]}
                          onChange={(e) =>
                            setInputKeys(prev => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={field.placeholder}
                          className="h-10 border-0 bg-transparent px-0 text-xs text-zinc-800 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={() => toggleVisibility(field.key)}
                          className="ml-2 shrink-0 text-zinc-400 transition-colors hover:text-zinc-800 dark:text-zinc-600 dark:hover:text-zinc-200"
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
                            className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200"
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
    </section>
  );
}

export { AI_FIELDS };
export type { KeyField };
