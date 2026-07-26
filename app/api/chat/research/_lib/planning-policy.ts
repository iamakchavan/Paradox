import type { ResearchPlanResult, ResearchPlanStep } from './types';

const MAX_SEARCH_QUERY_LENGTH = 500;
const MAX_URL_LENGTH = 2_048;
const PERMANENT_PROVIDER_STATUSES = new Set([401, 403, 404, 410]);

export class InvalidResearchPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResearchPlanError';
  }
}

export class ResearchPlanningError extends Error {
  readonly cause: unknown;

  constructor(cause: unknown) {
    super(
      'The selected model could not formulate a research plan. Try another model or verify that the provider model is available.',
    );
    this.name = 'ResearchPlanningError';
    this.cause = cause;
  }
}

function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, ' ').trim();
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function hasSearchableContent(value: string): boolean {
  const searchableCharacters = value.match(/[\p{L}\p{N}]/gu);
  return Boolean(searchableCharacters && searchableCharacters.length > 0);
}

function validateStep(step: ResearchPlanStep, index: number): ResearchPlanStep {
  const query = normalizeQuery(step.query);
  const isUrlStep = step.type === 'scrape' || step.type === 'map';

  if (!query) {
    throw new InvalidResearchPlanError(`Research step ${index + 1} has an empty query.`);
  }

  if (isUrlStep) {
    if (query.length > MAX_URL_LENGTH || !isHttpUrl(query)) {
      throw new InvalidResearchPlanError(
        `Research step ${index + 1} requires a valid HTTP or HTTPS URL.`,
      );
    }
  } else if (query.length > MAX_SEARCH_QUERY_LENGTH || !hasSearchableContent(query)) {
    throw new InvalidResearchPlanError(
      `Research step ${index + 1} does not contain a meaningful search query.`,
    );
  }

  return { ...step, query };
}

export function validateResearchPlan(planResult: ResearchPlanResult): ResearchPlanResult {
  if (!planResult.researchNeeded) {
    return { researchNeeded: false, plan: [] };
  }

  if (planResult.plan.length === 0) {
    throw new InvalidResearchPlanError('The planner did not provide any research steps.');
  }

  return {
    researchNeeded: true,
    plan: planResult.plan.map(validateStep),
  };
}

function collectNestedErrors(error: unknown): unknown[] {
  const pending = [error];
  const collected: unknown[] = [];
  const visited = new Set<unknown>();

  while (pending.length > 0 && collected.length < 20) {
    const current = pending.shift();
    if (current == null || visited.has(current)) continue;
    visited.add(current);
    collected.push(current);

    if (typeof current !== 'object') continue;
    const candidate = current as {
      cause?: unknown;
      lastError?: unknown;
      errors?: unknown[];
    };
    if (candidate.cause !== undefined) pending.push(candidate.cause);
    if (candidate.lastError !== undefined) pending.push(candidate.lastError);
    if (Array.isArray(candidate.errors)) pending.push(...candidate.errors);
  }

  return collected;
}

export function isPermanentProviderError(error: unknown): boolean {
  return collectNestedErrors(error).some((candidate) => {
    if (typeof candidate !== 'object' || candidate === null) return false;
    const statusCode = (candidate as { statusCode?: unknown }).statusCode;
    return typeof statusCode === 'number' && PERMANENT_PROVIDER_STATUSES.has(statusCode);
  });
}
