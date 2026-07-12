"use client";

import { ChevronDown } from 'lucide-react';
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
  const visibleSources = sources.length > 4 && !showAllSources ? sources.slice(0, 3) : sources.slice(0, 4);

  return (
    <div className="pt-3.5 mt-3.5 border-t border-zinc-200/60 dark:border-zinc-800/40">
      <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 select-none tracking-wider uppercase mb-1.5 px-1">
        Sources ({sources.length})
      </div>
      <div className="px-1 pb-1 -mx-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
          {visibleSources.map((source, index) => (
            <ResearchSourceCard key={index} source={source} citationIndex={index + 1} />
          ))}
          {sources.length > 4 && !showAllSources && (
            <motion.button
              whileHover={{ scale: 1.01, translateY: -0.5 }}
              transition={{ type: 'spring', stiffness: 450, damping: 15 }}
              onClick={() => setShowAllSources(true)}
              className="flex flex-col justify-between h-[80px] p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-100/50 dark:bg-zinc-900/40 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer group shadow-3xs text-left"
            >
              <div className="flex items-center gap-1 select-none">
                {sources.slice(3, 6).map((source, index) => (
                  <div
                    key={index}
                    className="w-5 h-5 rounded-full bg-zinc-200/50 dark:bg-white/5 flex items-center justify-center shrink-0 border border-border/10 overflow-hidden"
                  >
                    <FaviconImage domain={source.domain} className="w-3.5 h-3.5 rounded-full" />
                  </div>
                ))}
                {sources.length > 6 && (
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 font-mono pl-0.5">+</span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-zinc-650 dark:text-zinc-350 group-hover:text-zinc-800 dark:group-hover:text-zinc-100 transition-colors">
                View {sources.length - 3} more
              </span>
            </motion.button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {showAllSources && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden px-1 pb-1 -mx-1"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
                {sources.slice(4).map((source, index) => (
                  <ResearchSourceCard key={index + 4} source={source} citationIndex={index + 5} />
                ))}
                <motion.button
                  whileHover={{ scale: 1.01, translateY: -0.5 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 15 }}
                  onClick={() => setShowAllSources(false)}
                  className="flex flex-col justify-center items-center h-[80px] p-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800/50 bg-zinc-50/10 dark:bg-zinc-950/5 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer group shadow-3xs"
                >
                  <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors rotate-180 mb-1" />
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">
                    Show less
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResearchSourceCard({
  source,
  citationIndex,
}: {
  source: ResearchSource;
  citationIndex: number;
}) {
  return (
    <motion.a
      whileHover={{ scale: 1.01, translateY: -0.5 }}
      transition={{ type: 'spring', stiffness: 450, damping: 15 }}
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col justify-between h-[80px] p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-950/20 hover:bg-white dark:hover:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xs transition-all duration-200 no-underline group cursor-pointer"
    >
      <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
        {source.title || source.domain}
      </h4>
      <div className="flex items-center gap-1.5 min-w-0 mt-1.5 select-none">
        <FaviconImage domain={source.domain} className="w-3.5 h-3.5 rounded-xs" />
        <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-medium truncate flex-1">{source.domain}</span>
        <span className="text-zinc-300 dark:text-zinc-700/60 font-medium shrink-0">·</span>
        <span className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0 font-mono">{citationIndex}</span>
      </div>
    </motion.a>
  );
}
