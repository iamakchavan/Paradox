"use client";

import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOTION_EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function IntegrationsToolbar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onNewConnector,
}: {
  activeTab: 'skills' | 'connectors';
  setActiveTab: (tab: 'skills' | 'connectors') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNewConnector: () => void;
}) {
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-zinc-200/80 pb-3 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
      <div
        className="flex w-fit shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 p-1 dark:border-white/[0.08] dark:bg-white/[0.045]"
        role="tablist"
        aria-label="Integration views"
      >
        {(['skills', 'connectors'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'relative cursor-pointer select-none whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground/15',
              activeTab === tab
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200',
            )}
          >
            {activeTab === tab && (
              <motion.span
                layoutId="integrations-tab-indicator"
                className="pointer-events-none absolute inset-0 rounded-full bg-white shadow-xs dark:bg-white/[0.1] dark:shadow-none"
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: MOTION_EASE_OUT }}
              />
            )}
            <span className="relative z-10">{tab === 'skills' ? 'All Tools' : 'Connectors'}</span>
          </button>
        ))}
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-600" />
          <Input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder={activeTab === 'skills' ? 'Search tools' : 'Search connectors'}
            aria-label={activeTab === 'skills' ? 'Search tools' : 'Search connectors'}
            className="h-9 rounded-full border-zinc-200/80 bg-white/70 pl-9 pr-3 text-xs shadow-none focus-visible:border-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-200/70 dark:border-white/[0.08] dark:bg-white/[0.025] dark:focus-visible:border-white/[0.15] dark:focus-visible:ring-white/[0.06]"
          />
        </div>
        <Button
          onClick={onNewConnector}
          className="h-9 shrink-0 cursor-pointer gap-1.5 rounded-full border-0 bg-zinc-900 px-4 text-xs font-medium text-white shadow-none transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          New Connector
        </Button>
      </div>
    </div>
  );
}

