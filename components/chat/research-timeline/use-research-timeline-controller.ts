"use client";

import { useMemo, useState } from 'react';
import type { ResearchStep } from '@/lib/research/parser';
import { collectUniqueResearchSources, isExpandableResearchStep } from './research-timeline-utils';

export function useResearchTimelineController(steps: ResearchStep[], isLoading: boolean) {
  const [showAllSources, setShowAllSources] = useState(false);
  const [manuallyExpanded, setManuallyExpanded] = useState<Record<number, boolean>>({});
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);

  const isResearchRunning = useMemo(
    () => isLoading && !steps.some(step => step.type === 'synthesis'),
    [steps, isLoading]
  );
  const expandableStepsCount = useMemo(
    () => steps.filter(isExpandableResearchStep).length,
    [steps]
  );
  const expandedCount = useMemo(() => {
    return steps.reduce((count, step, index) => {
      if (!isExpandableResearchStep(step)) return count;
      const isExpanded = manuallyExpanded[index] !== undefined
        ? manuallyExpanded[index]
        : isLoading && index === steps.length - 1;
      return isExpanded ? count + 1 : count;
    }, 0);
  }, [steps, manuallyExpanded, isLoading]);
  const isAllExpanded = expandableStepsCount > 0 && expandedCount === expandableStepsCount;
  const hasManuallyExpanded = useMemo(
    () => Object.values(manuallyExpanded).some(value => value === true),
    [manuallyExpanded]
  );
  const shouldShowLines = useMemo(
    () => isLoading || isAllExpanded || hasManuallyExpanded,
    [isLoading, isAllExpanded, hasManuallyExpanded]
  );
  const uniqueSources = useMemo(() => collectUniqueResearchSources(steps), [steps]);

  const toggleExpandAll = (event: React.MouseEvent) => {
    event.stopPropagation();
    setManuallyExpanded(() => {
      const next: Record<number, boolean> = {};
      steps.forEach((step, index) => {
        if (isExpandableResearchStep(step)) {
          next[index] = !isAllExpanded;
        }
      });
      return next;
    });
  };

  const toggleStep = (index: number) => {
    setManuallyExpanded(previous => {
      const isLatestStep = index === steps.length - 1;
      const defaultState = isLoading && isLatestStep;
      const currentState = previous[index] !== undefined ? previous[index] : defaultState;
      return { ...previous, [index]: !currentState };
    });
  };

  const isStepExpanded = (index: number) => (
    manuallyExpanded[index] !== undefined
      ? manuallyExpanded[index]
      : isLoading && index === steps.length - 1
  );

  return {
    showAllSources,
    setShowAllSources,
    isTimelineCollapsed,
    setIsTimelineCollapsed,
    isResearchRunning,
    expandableStepsCount,
    isAllExpanded,
    shouldShowLines,
    uniqueSources,
    toggleExpandAll,
    toggleStep,
    isStepExpanded,
  };
}

export type ResearchTimelineController = ReturnType<typeof useResearchTimelineController>;
