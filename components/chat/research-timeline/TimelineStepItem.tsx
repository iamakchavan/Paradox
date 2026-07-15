"use client";

import { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FaviconImage } from '../FaviconImage';
import { getResearchStepPresentation, getSourceDomain, isExpandableResearchStep } from './research-timeline-utils';
import { TimelineStatusIndicator } from './TimelineStatusIndicator';
import { TimelineStepDetails } from './TimelineStepDetails';
import type { TimelineStepItemProps } from './types';

export const TimelineStepItem = memo(({
  step,
  stepKey,
  idx,
  totalSteps,
  isExpanded,
  isStepLoading,
  isLoading,
  shouldShowLines,
  toggleStep,
}: TimelineStepItemProps) => {
  const isCompleted = step.status === 'completed' || (!isLoading && step.status === 'started');
  const hasResults = Boolean(step.results?.length);
  const isExpandable = isExpandableResearchStep(step);
  const text = getResearchStepPresentation(step, isStepLoading);

  const content = (
    <>
      <TimelineStatusIndicator
        stepType={step.type}
        isStepLoading={isStepLoading}
        isCompleted={isCompleted}
        isFailed={step.status === 'failed'}
      />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className={cn(
          'text-xs transition-colors duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] flex-1 truncate pr-2 font-medium leading-relaxed',
          isStepLoading
            ? 'thinking-shine font-semibold text-foreground'
            : step.status === 'failed'
              ? 'text-muted-foreground/65'
              : 'text-foreground/80 group-hover:text-primary'
        )}>
          {text}
        </span>
        {!isExpanded && hasResults && (
          <div className="flex -space-x-1 items-center shrink-0 mr-1 select-none">
            {step.results!.slice(0, 3).map((result, resultIndex) => (
              <div
                key={resultIndex}
                className="w-4 h-4 rounded-full border border-background bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0 shadow-3xs"
                style={{ zIndex: 10 - resultIndex }}
              >
                <FaviconImage domain={getSourceDomain(result.url)} className="w-2.5 h-2.5 rounded-xs shrink-0" />
              </div>
            ))}
            {step.results!.length > 3 && (
              <span
                className="text-[7.5px] font-bold text-muted-foreground/80 bg-muted border border-border/30 rounded-full w-4 h-4 flex items-center justify-center shrink-0 shadow-3xs pl-[0.5px]"
                style={{ zIndex: 0 }}
              >
                +{step.results!.length - 3}
              </span>
            )}
          </div>
        )}
        {isExpandable && (
          <ChevronDown className={cn(
            'w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200 shrink-0',
            isExpanded && 'rotate-180'
          )} />
        )}
      </div>
    </>
  );

  return (
    <div className="relative flex flex-col gap-1">
      {shouldShowLines && idx < totalSteps - 1 && (
        <div
          className="absolute left-[10px] -translate-x-1/2 top-[28px] bottom-[-2px] w-[1.5px] bg-zinc-200 dark:bg-zinc-800/70 rounded-full select-none pointer-events-none"
          style={{ zIndex: 0 }}
        />
      )}
      {isExpandable ? (
        <button
          type="button"
          onClick={() => toggleStep(stepKey)}
          className="w-full flex items-center gap-3 text-left py-1.5 hover:bg-secondary/40 dark:hover:bg-zinc-800/10 rounded-lg px-2 -mx-2 transition-colors duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] cursor-pointer focus:outline-hidden group"
        >
          {content}
        </button>
      ) : (
        <div className="w-full flex items-center gap-3 text-left py-1.5 px-2 -mx-2 select-none">
          {content}
        </div>
      )}
      <AnimatePresence initial={false}>
        {isExpanded && isExpandable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden pl-8 pr-2"
          >
            <TimelineStepDetails step={step} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

TimelineStepItem.displayName = 'TimelineStepItem';
