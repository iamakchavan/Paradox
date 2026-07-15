import type { ResearchEventStatus, ResearchEventType } from './events';
import { normalizeSourceCollection } from './source-normalization';

export interface ResearchStep {
  type: ResearchEventType;
  status: Exclude<ResearchEventStatus, 'updated'>;
  id?: string;
  parentId?: string;
  order?: number;
  sequence?: number;
  query?: string;
  url?: string;
  results?: Array<{ title: string; url: string; content: string }>;
}

type ResearchResult = NonNullable<ResearchStep['results']>[number];

function decodeAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attributeRegex = /([\w-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attributeRegex.exec(source)) !== null) {
    attributes[match[1]] = decodeAttribute(match[2]);
  }
  return attributes;
}

export function parseResearchStream(content: string): {
  steps: ResearchStep[];
  cleanContent: string;
} {
  const steps: ResearchStep[] = [];
  let cleanContent = content;

  // Regex to extract all search results
  const resultsRegex = /<search-results(?:\s+step-id="([^"]+)")?>([\s\S]*?)<\/search-results>/g;
  const resultsByStepId = new Map<string, ResearchResult[]>();
  const legacyResults: ResearchResult[][] = [];
  let resultsMatch;
  while ((resultsMatch = resultsRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(resultsMatch[2]);
      const results = Array.isArray(parsed)
        ? parsed
        : parsed && Array.isArray(parsed.results)
          ? parsed.results
          : null;
      if (!results) continue;
      const normalizedResults = normalizeSourceCollection(results as ResearchResult[]);
      if (resultsMatch[1]) {
        resultsByStepId.set(decodeAttribute(resultsMatch[1]), normalizedResults);
      } else {
        legacyResults.push(normalizedResults);
      }
    } catch (e) {
      console.warn('[Parser] Failed to parse search results JSON:', e);
    }
  }

  // Remove search results tags from cleanContent
  cleanContent = cleanContent.replace(resultsRegex, '');

  // Regex for research steps
  const stepRegex = /<research-step\b([^>]*)\/?>/g;
  
  let stepMatch;
  let searchResultIndex = 0;

  while ((stepMatch = stepRegex.exec(content)) !== null) {
    const attributes = parseAttributes(stepMatch[1]);
    const type = attributes.type as ResearchEventType;
    const status = attributes.status as ResearchEventStatus;
    if (!type || !status) continue;
    const id = attributes.id;
    const parentId = attributes['parent-id'];
    const parsedOrder = attributes.order === undefined ? undefined : Number(attributes.order);
    const order = parsedOrder !== undefined && Number.isFinite(parsedOrder) ? parsedOrder : undefined;
    const query = attributes.query;
    const url = attributes.url;

    if (status === 'started') {
      steps.push({
        type,
        status: 'started',
        id,
        parentId,
        order,
        sequence: steps.length,
        query,
        url,
      });
    } else if (status === 'updated') {
      const matchingStep = id ? steps.find(step => step.id === id) : undefined;
      if (matchingStep) {
        if (parentId) matchingStep.parentId = parentId;
        if (order !== undefined) matchingStep.order = order;
        if (query) matchingStep.query = query;
        if (url) matchingStep.url = url;
      }
    } else if (status === 'completed' || status === 'failed') {
      const matchingStep = [...steps]
        .reverse()
        .find((step) => {
          if (step.status !== 'started') return false;
          if (id) return step.id === id;
          return step.type === type && (
            type === 'plan' || type === 'synthesis'
              ? true
              : url
                ? step.url === url
                : query
                  ? step.query === query
                  : true
          );
        });

      if (matchingStep) {
        matchingStep.status = status;
        if (id) matchingStep.id = id;
        if (parentId) matchingStep.parentId = parentId;
        if (order !== undefined) matchingStep.order = order;
        if (query) matchingStep.query = query;
        if (url) matchingStep.url = url;
        if (id && resultsByStepId.has(id)) {
          matchingStep.results = resultsByStepId.get(id);
        } else if ((type === 'search' || type === 'x' || type === 'scrape' || type === 'map')
          && searchResultIndex < legacyResults.length) {
          matchingStep.results = legacyResults[searchResultIndex++];
        }
      } else {
        const step: ResearchStep = {
          type,
          status,
          id,
          parentId,
          order,
          sequence: steps.length,
          query,
          url,
        };
        if (id && resultsByStepId.has(id)) {
          step.results = resultsByStepId.get(id);
        } else if ((type === 'search' || type === 'x' || type === 'scrape' || type === 'map')
          && searchResultIndex < legacyResults.length) {
          step.results = legacyResults[searchResultIndex++];
        }
        steps.push(step);
      }
    }
  }

  // Remove research step tags from cleanContent
  cleanContent = cleanContent.replace(stepRegex, '').trim();

  return {
    steps,
    cleanContent,
  };
}
