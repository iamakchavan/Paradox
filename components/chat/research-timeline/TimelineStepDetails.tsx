"use client";

import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ResearchStep } from '@/lib/research/parser';
import { FaviconImage } from '../FaviconImage';
import { getSourceDomain } from './research-timeline-utils';

const detailVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
};

export function TimelineStepDetails({ step }: { step: ResearchStep }) {
  const isSearch = step.type === 'search' || step.type === 'map';
  const isBrowse = step.type === 'browse' || step.type === 'scrape';
  const isX = step.type === 'x';
  const hasResults = Boolean(step.results?.length);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.08 },
        },
      }}
      className="mt-1 pb-3 pt-1 space-y-3"
    >
      {(isSearch || isX) && step.query && (
        <motion.div variants={detailVariants} className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Searching</span>
          <div className="flex flex-wrap gap-1.5">
            <motion.div className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded-full bg-secondary/80 dark:bg-secondary/40 border border-border/50 text-foreground/75 shadow-xs cursor-default select-none">
              <Search className="w-3 h-3 shrink-0 text-zinc-400 dark:text-zinc-500" />
              <span className="truncate max-w-[180px]">{step.query}</span>
            </motion.div>
          </div>
        </motion.div>
      )}

      {isBrowse && (step.url || step.query) && (
        <BrowseTarget step={step} />
      )}

      {hasResults && (
        <motion.div variants={detailVariants} className="flex flex-col gap-1">
          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Reading</span>
          <div className="flex flex-wrap gap-1.5">
            {step.results!.map((result, index) => {
              const domain = getSourceDomain(result.url);
              return (
                <a
                  key={index}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={result.title || domain}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded-full bg-secondary/80 dark:bg-secondary/40 hover:bg-secondary border border-border/50 hover:scale-[1.03] hover:-translate-y-0.5 transition-[background-color,color,transform] duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] motion-reduce:transform-none select-none shadow-xs cursor-pointer no-underline align-middle text-foreground/75 hover:text-foreground"
                >
                  <FaviconImage domain={domain} className="w-3.5 h-3.5 rounded-sm shrink-0" />
                  <span className="truncate max-w-[120px]">{domain}</span>
                </a>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function BrowseTarget({ step }: { step: ResearchStep }) {
  const targetUrl = step.url || step.query || '';
  if (!targetUrl.startsWith('http')) return null;
  const hostname = getSourceDomain(targetUrl);

  return (
    <motion.div variants={detailVariants} className="flex flex-col gap-1">
      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Reading</span>
      <div className="flex flex-wrap gap-1.5">
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded-full bg-secondary/80 dark:bg-secondary/40 hover:bg-secondary border border-border/50 hover:scale-[1.03] hover:-translate-y-0.5 transition-[background-color,color,transform] duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] motion-reduce:transform-none select-none shadow-xs cursor-pointer no-underline align-middle text-foreground/75 hover:text-foreground"
        >
          <FaviconImage domain={hostname} className="w-3.5 h-3.5 rounded-sm shrink-0" />
          <span className="truncate max-w-[120px] font-mono">{hostname}</span>
        </a>
      </div>
    </motion.div>
  );
}
