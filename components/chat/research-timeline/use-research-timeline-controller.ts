"use client";

import { useMemo, useState } from 'react';
import type { ResearchStep } from '@/lib/research/parser';
import {
  collectUniqueResearchSources,
  getResearchStepKey,
  isExpandableResearchStep,
  organizeResearchSteps,
} from './research-timeline-utils';

export function useResearchTimelineController(steps: ResearchStep[], isLoading: boolean) {
  const [showAllSources, setShowAllSources] = useState(false);
  const [manuallyExpanded, setManuallyExpanded] = useState<Record<string, boolean>>({});
  // Live research exposes its progress immediately. Completed research is
  // supporting history, so it stays compact until the user asks to inspect it.
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(() => !isLoading);

  const isResearchRunning = useMemo(
    () => isLoading && !steps.some(step => step.type === 'synthesis'),
    [steps, isLoading]
  );
  const organizedSteps = useMemo(() => organizeResearchSteps(steps), [steps]);
  const latestActiveStepKey = useMemo(() => {
    let latestKey: string | undefined;
    let latestSequence = -1;
    organizedSteps.forEach((step, index) => {
      if (step.status !== 'started') return;
      const sequence = step.sequence ?? index;
      if (sequence > latestSequence) {
        latestKey = getResearchStepKey(step, index);
        latestSequence = sequence;
      }
    });
    return latestKey;
  }, [organizedSteps]);
  const expandableStepsCount = useMemo(
    () => organizedSteps.filter(isExpandableResearchStep).length,
    [organizedSteps]
  );
  const expandedCount = useMemo(() => {
    return organizedSteps.reduce((count, step, index) => {
      if (!isExpandableResearchStep(step)) return count;
      const key = getResearchStepKey(step, index);
      const isExpanded = manuallyExpanded[key] !== undefined
        ? manuallyExpanded[key]
        : isLoading && key === latestActiveStepKey;
      return isExpanded ? count + 1 : count;
    }, 0);
  }, [organizedSteps, manuallyExpanded, isLoading, latestActiveStepKey]);
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
      const next: Record<string, boolean> = {};
      organizedSteps.forEach((step, index) => {
        if (isExpandableResearchStep(step)) {
          next[getResearchStepKey(step, index)] = !isAllExpanded;
        }
      });
      return next;
    });
  };

  const toggleStep = (key: string) => {
    setManuallyExpanded(previous => {
      const defaultState = isLoading && key === latestActiveStepKey;
      const currentState = previous[key] !== undefined ? previous[key] : defaultState;
      return { ...previous, [key]: !currentState };
    });
  };

  const isStepExpanded = (step: ResearchStep, index: number) => {
    const key = getResearchStepKey(step, index);
    return manuallyExpanded[key] !== undefined
      ? manuallyExpanded[key]
      : isLoading && key === latestActiveStepKey;
  };

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
    organizedSteps,
    toggleExpandAll,
    toggleStep,
    isStepExpanded,
  };
}

export type ResearchTimelineController = ReturnType<typeof useResearchTimelineController>;
