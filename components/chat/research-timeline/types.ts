import type { ResearchStep } from '@/lib/research/parser';

export interface ResearchTimelineProps {
  steps: ResearchStep[];
  isLoading: boolean;
  researchTime?: number;
}

export interface ResearchSource {
  title: string;
  url: string;
  domain: string;
}

export interface TimelineStepItemProps {
  step: ResearchStep;
  idx: number;
  totalSteps: number;
  isExpanded: boolean;
  isStepLoading: boolean;
  isLoading: boolean;
  shouldShowLines: boolean;
  toggleStep: (idx: number) => void;
}
