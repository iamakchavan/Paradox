"use client";

import { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_EASE_IN_OUT, motionTransitions } from '@/lib/motion';
import { DeepResearchIcon } from './research-timeline/DeepResearchIcon';
import { ResearchSources } from './research-timeline/ResearchSources';
import {
  formatResearchDuration,
  getResearchStepKey,
} from './research-timeline/research-timeline-utils';
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
  const timelineSteps = controller.organizedSteps;

  return (
    <section className="mb-7 w-full overflow-hidden rounded-xl border border-foreground/[0.08] bg-foreground/[0.018] dark:bg-foreground/[0.025]">
      <button
        type="button"
        onClick={() => controller.setIsTimelineCollapsed(previous => !previous)}
        className="group flex min-h-12 w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left outline-none transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] hover:bg-foreground/[0.025] focus-visible:bg-foreground/[0.035]"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <DeepResearchIcon className="h-[17px] w-[17px] shrink-0 text-foreground/70" />
          <span className={cn(
            'truncate text-[13px] font-medium transition-colors duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)]',
            controller.isResearchRunning ? 'deep-research-shimmer' : 'text-foreground/85'
          )}>
            Deep Research
          </span>
          {!isLoading && researchTime && researchTime > 0 && (
            <span className="shrink-0 select-none text-[12px] font-medium tabular-nums text-muted-foreground/85">
              {formatResearchDuration(researchTime)}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-normal text-muted-foreground/75">
          <span>{controller.uniqueSources.length} sources</span>
          <ChevronDown className={cn(
            'h-3.5 w-3.5 transition-transform duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)]',
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
            <div className="space-y-3 border-t border-foreground/[0.06] px-4 pb-3.5 pt-3">
              {controller.expandableStepsCount > 0 && (
                <div className="flex items-center justify-between px-2 text-[11px] font-normal text-muted-foreground/65 select-none">
                  <span>{timelineSteps.length} {timelineSteps.length === 1 ? 'step' : 'steps'}</span>
                  <button
                    type="button"
                    onClick={controller.toggleExpandAll}
                    className="flex cursor-pointer items-center gap-1 pr-1 text-[11px] transition-colors duration-[var(--motion-duration-fast)] hover:text-foreground"
                  >
                    {controller.isAllExpanded ? 'Collapse all' : 'Expand all'}
                  </button>
                </div>
              )}
              <div className="relative flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {timelineSteps.map((step, index) => {
                    const stepKey = getResearchStepKey(step, index);
                    return (
                      <motion.div
                        key={stepKey}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={motionTransitions.item}
                      >
                        <TimelineStepItem
                          step={step}
                          stepKey={stepKey}
                          idx={index}
                          totalSteps={timelineSteps.length}
                          isExpanded={controller.isStepExpanded(step, index)}
                          isStepLoading={step.status === 'started' && isLoading}
                          isLoading={isLoading}
                          shouldShowLines={controller.shouldShowLines}
                          toggleStep={controller.toggleStep}
                        />
                      </motion.div>
                    );
                  })}
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
    </section>
  );
});

ResearchTimeline.displayName = 'ResearchTimeline';
