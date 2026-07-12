"use client";

import { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useCustomToast } from '@/components/ui/custom-toast';
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AnswerSources } from '../AnswerSources';
import type { SearchResult } from './types';

interface Props {
  content: string;
  index: number;
  onBranchOff?: (index: number) => void;
  sources: SearchResult[];
}

export const MessageActions = memo(({ content, index, onBranchOff, sources }: Props) => {
  const { showToast } = useCustomToast();
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const [branchedId, setBranchedId] = useState<string | null>(null);
  const blockId = `${index}-${content}`;
  const branchId = `branch-${index}`;
  const copy = () => {
    const scrollPosition = window.scrollY;
    void navigator.clipboard.writeText(content);
    setCopiedBlockId(blockId);
    showToast({ message: 'Note copied to clipboard', type: 'success', mode: 'capsule' });
    window.scrollTo(0, scrollPosition);
    setTimeout(() => setCopiedBlockId(null), 2000);
  };
  return (
    <div className="mt-4 flex flex-wrap items-center justify-start gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            onClick={event => { event.preventDefault(); copy(); }}
            className="relative h-7 w-7 flex items-center justify-center rounded-md bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <div className="relative w-4 h-4">
              <svg viewBox="0 0 24 24" fill="none" className={cn('absolute inset-0 w-4 h-4 transition-all duration-200', copiedBlockId === blockId ? 'opacity-0 scale-75' : 'opacity-100 scale-100')}>
                <path d="M6 11C6 8.17157 6 6.75736 6.87868 5.87868C7.75736 5 9.17157 5 12 5H15C17.8284 5 19.2426 5 20.1213 5.87868C21 6.75736 21 8.17157 21 11V16C21 18.8284 21 20.2426 20.1213 21.1213C19.2426 22 17.8284 22 15 22H12C9.17157 22 7.75736 22 6 21.1213C6 20.2426 6 18.8284 6 16V11Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 19C4.34315 19 3 17.6569 3 16V10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H15C16.6569 2 18 3.34315 18 5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <CheckIcon visible={copiedBlockId === blockId} />
            </div>
          </button>
        </TooltipTrigger>
        <ActionTooltip>{copiedBlockId === blockId ? 'Copied!' : 'Copy'}</ActionTooltip>
      </Tooltip>
      {onBranchOff && (
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={event => {
                event.preventDefault();
                setBranchedId(branchId);
                onBranchOff(index);
                setTimeout(() => setBranchedId(null), 2000);
              }}
              className="relative h-7 w-7 flex items-center justify-center rounded-md bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <div className="relative w-4 h-4">
                <svg viewBox="0 0 24 24" fill="none" className={cn('absolute inset-0 w-4 h-4 transition-all duration-200', branchedId === branchId ? 'opacity-0 scale-75' : 'opacity-100 scale-100')}>
                  <path d="M6.02,5.78m0,15.31V4.55m0,0v-1.91m0,3.14v-1.23m0,1.23c0,1.61,1.21,3.11,3.2,3.94l4.58,1.92c1.98,.83,3.2,2.32,3.2,3.94v3.84" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20.53,17.59l-3.41,3.66-3.66-3.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <CheckIcon visible={branchedId === branchId} />
              </div>
            </button>
          </TooltipTrigger>
          <ActionTooltip>{branchedId === branchId ? 'Branched!' : 'Branch off'}</ActionTooltip>
        </Tooltip>
      )}
      <AnswerSources sources={sources} />
    </div>
  );
});
MessageActions.displayName = 'MessageActions';

function CheckIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn('absolute inset-0 w-4 h-4 text-green-500 transition-all duration-200', visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75')}>
      <path d="M4.5 12.75L10.5 18.75L19.5 5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActionTooltip({ children }: { children: React.ReactNode }) {
  return (
    <TooltipContent side="top" className="z-50 overflow-hidden rounded-lg border border-zinc-950/10 dark:border-zinc-800/50 bg-zinc-900 dark:bg-zinc-950 px-2.5 py-1 text-[11px] font-medium text-zinc-50 dark:text-zinc-200 select-none shadow-md animate-in fade-in-0 zoom-in-95">
      {children}
      <TooltipArrow className="fill-zinc-900 dark:fill-zinc-950" />
    </TooltipContent>
  );
}
