"use client";

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border shrink-0">
      <div className="flex gap-1 items-center bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-full border border-zinc-200 dark:border-border/40 w-fit shrink-0">
        {(['skills', 'connectors'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs transition-colors cursor-pointer select-none font-medium whitespace-nowrap',
              activeTab === tab
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-muted-foreground dark:hover:text-foreground',
            )}
          >
            {tab === 'skills' ? 'All Tools' : 'Connectors'}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search..."
            className="h-9 pl-9 pr-4 text-xs bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 rounded-full focus-visible:ring-1 focus-visible:ring-cyan-500/30"
          />
        </div>
        <Button
          onClick={onNewConnector}
          className="h-9 px-5 rounded-full text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200 cursor-pointer active:scale-[0.97] transition-all shrink-0 shadow-none border-0"
        >
          New Connector
        </Button>
      </div>
    </div>
  );
}

