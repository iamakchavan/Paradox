export type ResearchEventType =
  | 'search'
  | 'browse'
  | 'x'
  | 'plan'
  | 'synthesis'
  | 'scrape'
  | 'map';

export type ResearchEventStatus = 'started' | 'updated' | 'completed' | 'failed';

export interface ResearchEvent {
  type: ResearchEventType;
  status: ResearchEventStatus;
  id?: string;
  parentId?: string;
  order?: number;
  query?: string;
  url?: string;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function serializeResearchEvent(event: ResearchEvent): string {
  const attributes = [
    ['type', event.type],
    ['status', event.status],
    ['id', event.id],
    ['parent-id', event.parentId],
    ['order', event.order],
    ['query', event.query],
    ['url', event.url],
  ]
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name}="${escapeAttribute(String(value))}"`)
    .join(' ');

  return `<research-step ${attributes} />`;
}

export function serializeResearchResults(stepId: string, results: unknown): string {
  return `<search-results step-id="${escapeAttribute(stepId)}">${JSON.stringify(results)}</search-results>`;
}
