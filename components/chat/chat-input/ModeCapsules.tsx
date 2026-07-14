"use client";

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeepResearchIcon, WebSearchIcon } from './icons';

export function ModeCapsules({
  searchEnabled,
  researchEnabled,
  searchHovered,
  researchHovered,
  setSearchHovered,
  setResearchHovered,
  toggleSearch,
  toggleResearch,
}: {
  searchEnabled: boolean;
  researchEnabled: boolean;
  searchHovered: boolean;
  researchHovered: boolean;
  setSearchHovered: (hovered: boolean) => void;
  setResearchHovered: (hovered: boolean) => void;
  toggleSearch?: (enabled: boolean) => void;
  toggleResearch?: (enabled: boolean) => void;
}) {
  return (
    <>
      {searchEnabled && (
        <button
          type="button"
          onClick={() => { setSearchHovered(false); toggleSearch?.(false); }}
          onMouseDown={event => event.preventDefault()}
          onMouseEnter={() => setSearchHovered(true)}
          onMouseLeave={() => setSearchHovered(false)}
          className={cn(
            'flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transform-none select-none border shadow-[0_1px_2px_rgba(0,0,0,0.02)] shrink-0 active:scale-[0.93] active:duration-75',
            searchHovered
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/35 dark:border-blue-500/35'
              : 'bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20 hover:bg-blue-500/10',
          )}
        >
          {searchHovered
            ? <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            : <WebSearchIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          <span>Search</span>
        </button>
      )}
      {researchEnabled && (
        <button
          type="button"
          onClick={() => { setResearchHovered(false); toggleResearch?.(false); }}
          onMouseDown={event => event.preventDefault()}
          onMouseEnter={() => setResearchHovered(true)}
          onMouseLeave={() => setResearchHovered(false)}
          className={cn(
            'flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transform-none select-none border shadow-[0_1px_2px_rgba(0,0,0,0.02)] shrink-0 active:scale-[0.93] active:duration-75',
            researchHovered
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/35 dark:border-purple-500/35'
              : 'bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/20 hover:bg-purple-500/10',
          )}
        >
          {researchHovered
            ? <X className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            : <DeepResearchIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
          <span>Deep Research</span>
        </button>
      )}
    </>
  );
}
