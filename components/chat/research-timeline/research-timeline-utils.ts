import type { ResearchStep } from '@/lib/research/parser';
import type { ResearchSource } from './types';

export function isExpandableResearchStep(step: ResearchStep) {
  return step.type === 'search'
    || step.type === 'map'
    || step.type === 'browse'
    || step.type === 'scrape'
    || step.type === 'x';
}

export function getResearchStepPresentation(step: ResearchStep, isStepLoading: boolean) {
  if (step.type === 'plan') {
    const isSkipped = step.query === 'skipped';
    return isStepLoading
      ? 'Formulating research strategy...'
      : isSkipped
        ? 'Research not required'
        : 'Formulated research strategy';
  }
  if (step.type === 'synthesis') {
    return isStepLoading ? 'Synthesizing gathered details into final report...' : 'Synthesized final report';
  }
  if (step.type === 'map') {
    return isStepLoading ? `Exploring website: ${step.query}...` : `Explored website: ${step.query}`;
  }
  if (step.type === 'search') {
    return isStepLoading ? `Finding sources for "${step.query}"...` : `Searched for "${step.query}"`;
  }
  if (step.type === 'browse' || step.type === 'scrape') {
    const hostname = getResearchStepHostname(step);
    return isStepLoading ? `Reading page: ${hostname}...` : `Read page: ${hostname}`;
  }
  if (step.type === 'x') {
    return isStepLoading
      ? `Scanning social discussions for "${step.query}"...`
      : `Scanned social discussions for "${step.query}"`;
  }
  return '';
}

export function getResearchStepHostname(step: ResearchStep) {
  try {
    return step.url ? new URL(step.url).hostname.replace('www.', '') : '';
  } catch {
    try {
      return step.query ? new URL(step.query).hostname.replace('www.', '') : '';
    } catch {
      return step.url || step.query || '';
    }
  }
}

export function getSourceDomain(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function collectUniqueResearchSources(steps: ResearchStep[]): ResearchSource[] {
  const sources = new Map<string, ResearchSource>();
  steps.forEach(step => {
    step.results?.forEach(result => {
      if (!result.url) return;
      try {
        const domain = new URL(result.url).hostname.replace('www.', '');
        sources.set(result.url, {
          title: result.title || domain,
          url: result.url,
          domain,
        });
      } catch {
        // Invalid source URLs were ignored by the original timeline.
      }
    });
  });
  return Array.from(sources.values());
}

export function formatResearchDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}sec`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return remainingSeconds > 0 ? `${minutes}min${remainingSeconds}s` : `${minutes}min`;
}
