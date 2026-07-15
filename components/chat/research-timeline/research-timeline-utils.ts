import type { ResearchStep } from '@/lib/research/parser';
import type { ResearchSource } from './types';

function compareResearchSteps(first: ResearchStep, second: ResearchStep) {
  const firstOrder = first.order ?? first.sequence ?? Number.MAX_SAFE_INTEGER;
  const secondOrder = second.order ?? second.sequence ?? Number.MAX_SAFE_INTEGER;
  return firstOrder - secondOrder;
}

export function getResearchStepKey(step: ResearchStep, fallbackIndex: number) {
  return step.id || `legacy-${fallbackIndex}-${step.type}-${step.query || step.url || ''}`;
}

export function organizeResearchSteps(steps: ResearchStep[]): ResearchStep[] {
  const visibleSteps = steps.filter(step => !(
    step.status === 'failed' && (step.type === 'browse' || step.type === 'scrape')
  ));
  if (!visibleSteps.some(step => step.id || step.parentId)) return visibleSteps;

  const childrenByParent = new Map<string, ResearchStep[]>();
  const roots: ResearchStep[] = [];
  const emittedSteps = new Set<ResearchStep>();

  for (const step of visibleSteps) {
    if (step.parentId) {
      const siblings = childrenByParent.get(step.parentId) || [];
      siblings.push(step);
      childrenByParent.set(step.parentId, siblings);
    } else {
      roots.push(step);
    }
  }

  const organized: ResearchStep[] = [];
  const appendBranch = (step: ResearchStep) => {
    organized.push(step);
    emittedSteps.add(step);
    const children = step.id ? childrenByParent.get(step.id) : undefined;
    children?.sort(compareResearchSteps).forEach(appendBranch);
  };

  roots.sort(compareResearchSteps).forEach(appendBranch);

  // A partially streamed or legacy message can contain a child before its
  // parent. Preserve it until the next stream update supplies the parent.
  visibleSteps.forEach(step => {
    if (!emittedSteps.has(step)) organized.push(step);
  });

  return organized;
}

export function isExpandableResearchStep(step: ResearchStep) {
  return step.type === 'search'
    || step.type === 'map'
    || step.type === 'browse'
    || step.type === 'scrape'
    || step.type === 'x';
}

export function getResearchStepPresentation(step: ResearchStep, isStepLoading: boolean) {
  const isFailed = step.status === 'failed';
  if (step.type === 'plan') {
    if (isFailed) return 'Could not formulate a research strategy';
    const isSkipped = step.query === 'skipped';
    return isStepLoading
      ? 'Formulating research strategy...'
      : isSkipped
        ? 'Research not required'
        : 'Formulated research strategy';
  }
  if (step.type === 'synthesis') {
    if (isFailed) return 'Could not synthesize the final report';
    return isStepLoading ? 'Synthesizing gathered details into final report...' : 'Synthesized final report';
  }
  if (step.type === 'map') {
    if (isFailed) return `Could not explore website: ${step.query}`;
    return isStepLoading ? `Exploring website: ${step.query}...` : `Explored website: ${step.query}`;
  }
  if (step.type === 'search') {
    if (isFailed) return `Could not find sources for "${step.query}"`;
    return isStepLoading ? `Finding sources for "${step.query}"...` : `Searched for "${step.query}"`;
  }
  if (step.type === 'browse' || step.type === 'scrape') {
    const hostname = getResearchStepHostname(step);
    if (isFailed) return `Could not read page: ${hostname}`;
    return isStepLoading ? `Reading page: ${hostname}...` : `Read page: ${hostname}`;
  }
  if (step.type === 'x') {
    if (isFailed) return `Could not scan social discussions for "${step.query}"`;
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
