"use client";

import { ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaviconImage } from '../FaviconImage';
import type { ResearchSource } from './types';

export function ResearchSources({
  sources,
  showAllSources,
  setShowAllSources,
}: {
  sources: ResearchSource[];
  showAllSources: boolean;
  setShowAllSources: (show: boolean) => void;
}) {
  if (sources.length === 0) return null;

  const visibleSources = sources.length > 4 && !showAllSources
    ? sources.slice(0, 3)
    : sources.slice(0, 4);

  return (
    <div className="border-t border-foreground/[0.06] px-3 pb-3 pt-2.5">
      <div className="mb-2 px-1 text-[11px] font-normal text-muted-foreground/65 select-none">
        Sources
      </div>

      <div className="overflow-hidden rounded-lg bg-foreground/[0.025] ring-1 ring-inset ring-foreground/[0.055]">
        <div className="grid grid-cols-2 gap-px bg-foreground/[0.055] sm:grid-cols-3 md:grid-cols-4">
          {visibleSources.map((source, index) => (
            <ResearchSourceItem key={source.url} source={source} citationIndex={index + 1} />
          ))}

          {sources.length > 4 && !showAllSources && (
            <button
              type="button"
              onClick={() => setShowAllSources(true)}
              className="group flex min-h-[72px] cursor-pointer flex-col justify-between bg-background/80 p-3 text-left transition-colors duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] hover:bg-background/55 focus-visible:outline-none focus-visible:bg-background/55"
            >
              <div className="flex -space-x-1 select-none">
                {sources.slice(3, 6).map((source, index) => (
                  <div
                    key={source.url}
                    className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background ring-1 ring-background"
                    style={{ zIndex: 3 - index }}
                  >
                    <FaviconImage domain={source.domain} className="h-3.5 w-3.5 rounded-full" />
                  </div>
                ))}
                {sources.length > 6 && (
                  <span className="pl-2 text-[10px] text-muted-foreground/60">+</span>
                )}
              </div>
              <span className="text-[11px] font-medium text-foreground/70 transition-colors group-hover:text-foreground">
                View {sources.length - 3} more
              </span>
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {showAllSources && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-px border-t border-foreground/[0.055] bg-foreground/[0.055] sm:grid-cols-3 md:grid-cols-4">
                {sources.slice(4).map((source, index) => (
                  <ResearchSourceItem key={source.url} source={source} citationIndex={index + 5} />
                ))}
                <button
                  type="button"
                  onClick={() => setShowAllSources(false)}
                  className="group flex min-h-[72px] cursor-pointer items-center justify-center gap-1.5 bg-background/80 p-3 text-[11px] font-medium text-muted-foreground transition-colors duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] hover:bg-background/55 hover:text-foreground focus-visible:outline-none focus-visible:bg-background/55"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Show less</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResearchSourceItem({
  source,
  citationIndex,
}: {
  source: ResearchSource;
  citationIndex: number;
}) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-[72px] cursor-pointer flex-col justify-between bg-background/80 p-3 no-underline transition-colors duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] hover:bg-background/55 focus-visible:outline-none focus-visible:bg-background/55"
    >
      <h4 className="line-clamp-2 flex-1 text-[11px] font-medium leading-snug text-foreground/80 transition-colors group-hover:text-foreground">
        {source.title || source.domain}
      </h4>
      <div className="mt-2 flex min-w-0 items-center gap-1.5 select-none">
        <FaviconImage domain={source.domain} className="h-3.5 w-3.5 rounded-xs" />
        <span className="flex-1 truncate text-[9.5px] font-normal text-muted-foreground/65">
          {source.domain}
        </span>
        <span className="shrink-0 text-[9.5px] font-normal tabular-nums text-muted-foreground/45">
          {citationIndex}
        </span>
      </div>
    </a>
  );
}
