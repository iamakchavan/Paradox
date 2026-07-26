import {
  createScrapeSession,
  executeMapPage,
  executeScrapePage,
  executeWebSearch,
  rankUrlRelevance,
  type SearchKeys,
  type SearchResult,
  type ScrapeSession,
} from '@/lib/research/client';
import { RESEARCH_LIMITS } from '@/lib/research/config';
import {
  serializeResearchEvent,
  serializeResearchResults,
  type ResearchEvent,
  type ResearchEventStatus,
} from '@/lib/research/events';
import {
  createDeadlineSignal,
  mapWithConcurrency,
} from '@/lib/research/request-policy';
import { extractTitleFromMarkdown, getFriendlyTitleFromUrl } from '../../_lib/source-utils';
import type {
  ResearchExecutionResult,
  ResearchPlanResult,
  ResearchStreamEmitter,
  ScrapedDocument,
  SearchResultBucket,
} from './types';

interface ExecuteResearchPlanOptions {
  planResult: ResearchPlanResult;
  searchKeys: SearchKeys;
  emit: ResearchStreamEmitter;
  signal?: AbortSignal;
}

type ActiveResearchEvent = Omit<ResearchEvent, 'status' | 'id'> & { id: string };

interface ResearchReporter {
  start: (event: ActiveResearchEvent) => void;
  update: (id: string, changes: Partial<Omit<ActiveResearchEvent, 'id'>>) => void;
  finish: (
    id: string,
    status?: Exclude<ResearchEventStatus, 'started' | 'updated'>,
    results?: SearchResult[],
  ) => void;
  failActive: () => void;
}

interface ResearchBranch {
  id: string;
  order: number;
  reporter: ResearchReporter;
}

interface ScrapeCandidate {
  url: string;
  title?: string;
}

function createResearchReporter(emit: ResearchStreamEmitter): ResearchReporter {
  const activeEvents = new Map<string, ActiveResearchEvent>();
  const finish: ResearchReporter['finish'] = (id, status = 'completed', results) => {
    const event = activeEvents.get(id);
    if (!event) return;
    emit(serializeResearchEvent({ ...event, status }));
    if (results !== undefined) emit(serializeResearchResults(id, results));
    activeEvents.delete(id);
  };

  return {
    start(event) {
      activeEvents.set(event.id, event);
      emit(serializeResearchEvent({ ...event, status: 'started' }));
    },
    update(id, changes) {
      const event = activeEvents.get(id);
      if (!event) return;
      const updatedEvent = { ...event, ...changes, id };
      activeEvents.set(id, updatedEvent);
      emit(serializeResearchEvent({ ...updatedEvent, status: 'updated' }));
    },
    finish,
    failActive() {
      for (const id of Array.from(activeEvents.keys())) {
        finish(id, 'failed');
      }
    },
  };
}

function extractUrls(value: string): string[] {
  const matches = value.match(/(https?:\/\/[^\s]+)/g);
  if (!matches) return [];
  return matches.map((url) => url.replace(/[.,;?!)]+$/, ''));
}

function reserveScrapeCandidates(
  candidates: ScrapeCandidate[],
  scrapedUrls: Set<string>,
): ScrapeCandidate[] {
  const reserved: ScrapeCandidate[] = [];
  for (const candidate of candidates) {
    if (!candidate.url || scrapedUrls.has(candidate.url)) continue;
    scrapedUrls.add(candidate.url);
    reserved.push(candidate);
    if (reserved.length >= RESEARCH_LIMITS.SCRAPE_CANDIDATE_LIMIT) break;
  }
  return reserved;
}

async function readScrapeCandidates(
  candidates: ScrapeCandidate[],
  searchKeys: SearchKeys,
  scrapedDocuments: ScrapedDocument[],
  branch: ResearchBranch,
  scrapeSession: ScrapeSession,
  signal?: AbortSignal,
): Promise<void> {
  const { id: branchId, reporter } = branch;
  let successfulReads = 0;
  let activeSlotId: string | null = null;

  for (const candidate of candidates) {
    if (successfulReads >= RESEARCH_LIMITS.SCRAPE_SUCCESS_TARGET) break;

    const slotId = `${branchId}:browse:${successfulReads}`;
    if (activeSlotId === null) {
      activeSlotId = slotId;
      reporter.start({
        id: slotId,
        parentId: branchId,
        type: 'browse',
        order: successfulReads,
        url: candidate.url,
      });
    } else {
      reporter.update(activeSlotId, { url: candidate.url });
    }

    try {
      console.log(`[DEEP RESEARCH STEP] Scraping candidate URL: ${candidate.url}`);
      const content = await executeScrapePage(
        candidate.url,
        searchKeys,
        signal,
        scrapeSession,
      );
      if (!content) continue;

      const title = extractTitleFromMarkdown(
        content,
        candidate.title || getFriendlyTitleFromUrl(candidate.url),
      );
      scrapedDocuments.push({ url: candidate.url, title, content });
      reporter.finish(activeSlotId);
      successfulReads += 1;
      activeSlotId = null;
    } catch (error) {
      if (signal?.aborted) throw error;
      console.error(
        `[DEEP RESEARCH STEP] Scraping candidate failed for ${candidate.url}:`,
        error,
      );
    }
  }

  if (activeSlotId !== null) reporter.finish(activeSlotId, 'failed');
}

async function executeSearchStep(
  query: string,
  scrapeUrls: boolean,
  searchKeys: SearchKeys,
  searchResults: SearchResultBucket[],
  scrapedDocuments: ScrapedDocument[],
  scrapedUrls: Set<string>,
  branch: ResearchBranch,
  scrapeSession: ScrapeSession,
  signal?: AbortSignal,
): Promise<void> {
  const { id: branchId, order, reporter } = branch;
  reporter.start({ id: branchId, type: 'search', order, query });
  const extractedUrls = extractUrls(query);
  if (extractedUrls.length > 0) {
    console.log(
      '[DEEP RESEARCH STEP] Search query contains URLs. Redirecting to direct scrape:',
      extractedUrls,
    );
    const mockSearchResults: SearchResult[] = [];
    for (let urlIndex = 0; urlIndex < extractedUrls.length; urlIndex++) {
      const url = extractedUrls[urlIndex];
      const browseId = `${branchId}:browse:${urlIndex}`;
      reporter.start({
        id: browseId,
        parentId: branchId,
        type: 'browse',
        order: urlIndex,
        url,
      });
      try {
        const content = await executeScrapePage(url, searchKeys, signal, scrapeSession);
        if (!content) {
          reporter.finish(browseId, 'failed');
          continue;
        }
        const title = extractTitleFromMarkdown(content, getFriendlyTitleFromUrl(url));
        scrapedDocuments.push({ url, title, content });
        mockSearchResults.push({
          title,
          url,
          content: content.substring(0, 1500),
        });
        reporter.finish(browseId);
      } catch (error) {
        if (signal?.aborted) throw error;
        console.error(`[DEEP RESEARCH STEP] Direct scrape fallback failed for ${url}:`, error);
        reporter.finish(browseId, 'failed');
      }
    }

    searchResults.push({ query, results: mockSearchResults });
    reporter.finish(branchId, mockSearchResults.length > 0 ? 'completed' : 'failed', mockSearchResults);
    return;
  }

  try {
    const rawResults = await executeWebSearch(query, searchKeys, 5, false, signal);
    const results = rankUrlRelevance(query, rawResults).slice(0, 5);
    searchResults.push({ query, results });
    reporter.finish(branchId, 'completed', results);

    if (scrapeUrls && results.length > 0) {
      const candidates = reserveScrapeCandidates(
        results.map((result) => ({ url: result.url, title: result.title })),
        scrapedUrls,
      );
      await readScrapeCandidates(
        candidates,
        searchKeys,
        scrapedDocuments,
        branch,
        scrapeSession,
        signal,
      );
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    console.error(`[DEEP RESEARCH STEP] Search failed for query "${query}":`, error);
    reporter.finish(branchId, 'failed');
  }
}

async function executeScrapeStep(
  query: string,
  searchKeys: SearchKeys,
  searchResults: SearchResultBucket[],
  scrapedDocuments: ScrapedDocument[],
  branch: ResearchBranch,
  scrapeSession: ScrapeSession,
  signal?: AbortSignal,
): Promise<void> {
  const { id: branchId, order, reporter } = branch;
  reporter.start({ id: branchId, type: 'scrape', order, query });
  const cleanQuery = query.trim();
  const extractedUrls = extractUrls(cleanQuery);
  const urlsToScrape = extractedUrls.length > 0 ? extractedUrls : [cleanQuery];

  const mockSearchResults: SearchResult[] = [];
  for (let urlIndex = 0; urlIndex < urlsToScrape.length; urlIndex++) {
    const url = urlsToScrape[urlIndex];
    if (!url || !url.trim()) continue;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }
    const browseId = `${branchId}:browse:${urlIndex}`;
    reporter.start({
      id: browseId,
      parentId: branchId,
      type: 'browse',
      order: urlIndex,
      url: finalUrl,
    });

    try {
      console.log(`[DEEP RESEARCH STEP] Direct scrape URL: ${finalUrl}`);
      const content = await executeScrapePage(finalUrl, searchKeys, signal, scrapeSession);
      if (!content) {
        reporter.finish(browseId, 'failed');
        continue;
      }
      const title = extractTitleFromMarkdown(content, getFriendlyTitleFromUrl(finalUrl));
      scrapedDocuments.push({ url: finalUrl, title, content });
      mockSearchResults.push({
        title,
        url: finalUrl,
        content: content.substring(0, 1500),
      });
      reporter.finish(browseId);
    } catch (error) {
      if (signal?.aborted) throw error;
      console.error(`[DEEP RESEARCH STEP] Direct scrape failed for ${finalUrl}:`, error);
      reporter.finish(browseId, 'failed');
    }
  }

  searchResults.push({ query, results: mockSearchResults });
  reporter.finish(branchId, mockSearchResults.length > 0 ? 'completed' : 'failed', mockSearchResults);
}

async function executeMapStep(
  query: string,
  searchKeys: SearchKeys,
  searchResults: SearchResultBucket[],
  scrapedDocuments: ScrapedDocument[],
  scrapedUrls: Set<string>,
  branch: ResearchBranch,
  scrapeSession: ScrapeSession,
  signal?: AbortSignal,
): Promise<void> {
  const { id: branchId, order, reporter } = branch;
  reporter.start({ id: branchId, type: 'map', order, query });

  try {
    let finalUrl = query.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    console.log(`[DEEP RESEARCH STEP] Mapping site: ${finalUrl}`);
    const links = await executeMapPage(finalUrl, searchKeys, 15, signal);
    console.log(`[DEEP RESEARCH STEP] Mapped links count: ${links.length}`);

    const results = links.map((linkUrl) => ({
      title: getFriendlyTitleFromUrl(linkUrl),
      url: linkUrl,
      content: `Discovered subpage of ${new URL(linkUrl).hostname} via website mapping: ${linkUrl}`,
    }));
    searchResults.push({ query, results });
    reporter.finish(branchId, results.length > 0 ? 'completed' : 'failed', results);

    const candidates = reserveScrapeCandidates(
      links.map((url) => ({ url })),
      scrapedUrls,
    );
    await readScrapeCandidates(
      candidates,
      searchKeys,
      scrapedDocuments,
      branch,
      scrapeSession,
      signal,
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    console.error(`[DEEP RESEARCH STEP] Mapping failed for "${query}":`, error);
    reporter.finish(branchId, 'failed');
  }
}

async function executeSocialStep(
  query: string,
  searchKeys: SearchKeys,
  searchResults: SearchResultBucket[],
  branch: ResearchBranch,
  signal?: AbortSignal,
): Promise<void> {
  const { id: branchId, order, reporter } = branch;
  reporter.start({ id: branchId, type: 'x', order, query });
  try {
    const rawResults = await executeWebSearch(query, searchKeys, 5, true, signal);
    const results = rawResults.slice(0, 5);
    searchResults.push({ query, results });
    reporter.finish(branchId, 'completed', results);
  } catch (error) {
    if (signal?.aborted) throw error;
    console.error(`[DEEP RESEARCH STEP] X search failed for query "${query}":`, error);
    reporter.finish(branchId, 'failed');
  }
}

export async function executeResearchPlan({
  planResult,
  searchKeys,
  emit,
  signal,
}: ExecuteResearchPlanOptions): Promise<ResearchExecutionResult> {
  const searchResults: SearchResultBucket[] = [];
  const scrapedDocuments: ScrapedDocument[] = [];
  const scrapedUrls = new Set<string>();
  const scrapeSession = createScrapeSession();
  const reporter = createResearchReporter(emit);
  const stepOutputs: Array<{
    searchResults: SearchResultBucket[];
    scrapedDocuments: ScrapedDocument[];
  } | undefined> = new Array(planResult.plan.length);

  if (!planResult.researchNeeded || planResult.plan.length === 0) {
    return { searchResults, scrapedDocuments };
  }

  const executionBudget = createDeadlineSignal(signal, RESEARCH_LIMITS.EXECUTION_BUDGET_MS);
  let wasTruncated = false;

  try {
    await mapWithConcurrency(
      planResult.plan,
      RESEARCH_LIMITS.PLAN_CONCURRENCY,
      async (step, stepIndex) => {
        const stepSearchResults: SearchResultBucket[] = [];
        const stepScrapedDocuments: ScrapedDocument[] = [];
        stepOutputs[stepIndex] = {
          searchResults: stepSearchResults,
          scrapedDocuments: stepScrapedDocuments,
        };
        console.log(
          `[DEEP RESEARCH STEP] Running step: type=${step.type}, query="${step.query}", scrapeUrls=${step.scrapeUrls}`,
        );
        const branch: ResearchBranch = {
          id: `research-branch-${stepIndex}`,
          order: stepIndex,
          reporter,
        };

        if (step.type === 'search') {
          await executeSearchStep(
            step.query,
            step.scrapeUrls,
            searchKeys,
            stepSearchResults,
            stepScrapedDocuments,
            scrapedUrls,
            branch,
            scrapeSession,
            executionBudget.signal,
          );
        } else if (step.type === 'scrape') {
          await executeScrapeStep(
            step.query,
            searchKeys,
            stepSearchResults,
            stepScrapedDocuments,
            branch,
            scrapeSession,
            executionBudget.signal,
          );
        } else if (step.type === 'map') {
          await executeMapStep(
            step.query,
            searchKeys,
            stepSearchResults,
            stepScrapedDocuments,
            scrapedUrls,
            branch,
            scrapeSession,
            executionBudget.signal,
          );
        } else if (step.type === 'x') {
          await executeSocialStep(
            step.query,
            searchKeys,
            stepSearchResults,
            branch,
            executionBudget.signal,
          );
        }
      },
      executionBudget.signal,
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    reporter.failActive();
    if (!executionBudget.didTimeout()) throw error;
    wasTruncated = true;
    console.warn('[Deep Research] Execution budget reached; synthesizing available results.');
  } finally {
    executionBudget.dispose();
  }

  for (const output of stepOutputs) {
    if (!output) continue;
    searchResults.push(...output.searchResults);
    scrapedDocuments.push(...output.scrapedDocuments);
  }

  return { searchResults, scrapedDocuments, wasTruncated };
}
