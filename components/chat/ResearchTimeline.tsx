"use client";

import { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_EASE_IN_OUT, motionTransitions } from '@/lib/motion';
import { DeepResearchIcon } from './research-timeline/DeepResearchIcon';
import { ResearchSources } from './research-timeline/ResearchSources';
import { formatResearchDuration } from './research-timeline/research-timeline-utils';
import { TimelineStepItem } from './research-timeline/TimelineStepItem';
import type { ResearchTimelineProps } from './research-timeline/types';
import { useResearchTimelineController } from './research-timeline/use-research-timeline-controller';

export const ResearchTimeline = memo(function ResearchTimeline({
  steps,
  isLoading,
  researchTime,
}: ResearchTimelineProps) {
  const controller = useResearchTimelineController(steps, isLoading);
  if (steps.length === 0) return null;

  return (
    <div className="w-full mb-6 rounded-2xl border border-zinc-200/85 dark:border-zinc-800/90 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md p-3.5 shadow-3xs overflow-hidden">
      <button
        type="button"
        onClick={() => controller.setIsTimelineCollapsed(previous => !previous)}
        className="w-full flex items-center justify-between pb-1 text-left cursor-pointer focus:outline-hidden group"
      >
        <div className="flex items-center gap-2">
          <DeepResearchIcon className="w-[18px] h-[18px] text-zinc-650 dark:text-zinc-350 shrink-0" />
          <span className={cn(
            'text-sm font-semibold transition-colors duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)]',
            controller.isResearchRunning ? 'deep-research-shimmer font-bold' : 'text-foreground/90'
          )}>
            Deep Research
          </span>
          {!isLoading && researchTime && researchTime > 0 && (
            <span className="text-xs font-normal text-muted-foreground/80 ml-1.5 select-none">
              ({formatResearchDuration(researchTime)})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <span>{controller.uniqueSources.length} sources</span>
          <ChevronDown className={cn(
            'w-4 h-4 transition-transform duration-250',
            !controller.isTimelineCollapsed && 'rotate-180'
          )} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!controller.isTimelineCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: MOTION_EASE_IN_OUT }}
            className="overflow-hidden"
          >
            <div className="pt-3.5 space-y-4">
              {controller.expandableStepsCount > 0 && (
                <div className="flex items-center justify-between px-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 select-none tracking-wider">
                  <span>{steps.length} {steps.length === 1 ? 'STEP' : 'STEPS'}</span>
                  <button
                    type="button"
                    onClick={controller.toggleExpandAll}
                    className="hover:text-foreground cursor-pointer transition-colors duration-150 flex items-center gap-1 select-none pr-1 uppercase tracking-widest text-[9.5px]"
                  >
                    {controller.isAllExpanded ? 'Collapse all' : 'Expand all'}
                  </button>
                </div>
              )}
              <div className="relative flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={motionTransitions.item}
                    >
                      <TimelineStepItem
                        step={step}
                        idx={index}
                        totalSteps={steps.length}
                        isExpanded={controller.isStepExpanded(index)}
                        isStepLoading={step.status === 'started' && isLoading}
                        isLoading={isLoading}
                        shouldShowLines={controller.shouldShowLines}
                        toggleStep={controller.toggleStep}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ResearchSources
        sources={controller.uniqueSources}
        showAllSources={controller.showAllSources}
        setShowAllSources={controller.setShowAllSources}
      />
    </div>
  );
});

ResearchTimeline.displayName = 'ResearchTimeline';
