"use client";

import { Search, X } from 'lucide-react';
import type { LibraryBrowserController } from './use-library-browser';
import type { LibraryFilter } from './types';

const FILTERS: LibraryFilter[] = ['all', 'image', 'pdf'];

export function LibraryToolbar({ browser }: { browser: LibraryBrowserController }) {
  const { query, setQuery, typeFilter, setTypeFilter } = browser;

  return (
    <>
      <div className="flex flex-col gap-1.5 mb-8">
        <h1 className="text-[20px] font-semibold tracking-tight text-foreground/90 leading-none">
          Library
        </h1>
        <p className="text-[12.5px] text-foreground/45 leading-normal">
          Browse and download files uploaded across all your conversation histories.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-foreground/30" />
          <input
            type="text"
            placeholder="Search files..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full h-9 pl-9 pr-8 bg-foreground/[0.02] dark:bg-foreground/[0.01] border border-foreground/[0.08] focus:border-foreground/30 rounded-lg text-[13px] focus:outline-none transition-all duration-150 placeholder:text-foreground/30 text-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-3 text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-foreground/[0.03] dark:bg-foreground/[0.015] border border-foreground/[0.04] p-0.5 rounded-lg text-[12px] font-medium text-foreground/50 self-start sm:self-auto">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setTypeFilter(filter)}
              className={`px-3 py-1 rounded-md transition-all duration-200 cursor-pointer ${
                typeFilter === filter
                  ? 'bg-background text-foreground/90 shadow-sm font-semibold'
                  : 'hover:text-foreground/80'
              }`}
            >
              {filter === 'all' && 'All'}
              {filter === 'image' && 'Images'}
              {filter === 'pdf' && 'Documents'}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
