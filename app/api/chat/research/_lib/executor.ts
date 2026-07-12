import {
  executeMapPage,
  executeScrapePage,
  executeWebSearch,
  rankUrlRelevance,
  type SearchKeys,
  type SearchResult,
} from '@/lib/research/client';
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
}

function extractUrls(value: string): string[] {
  const matches = value.match(/(https?:\/\/[^\s]+)/g);
  if (!matches) return [];
  return matches.map((url) => url.replace(/[.,;?!)]+$/, ''));
}

function escapeAttribute(value: string): string {
  return value ? value.replace(/"/g, '&quot;') : '';
}

async function executeSearchStep(
  query: string,
  scrapeUrls: boolean,
  searchKeys: SearchKeys,
  searchResults: SearchResultBucket[],
  scrapedDocuments: ScrapedDocument[],
  scrapedUrls: Set<string>,
  emit: ResearchStreamEmitter,
): Promise<void> {
  const escapedQuery = escapeAttribute(query);
  const extractedUrls = extractUrls(query);
  if (extractedUrls.length > 0) {
    console.log(
      '[DEEP RESEARCH STEP] Search query contains URLs. Redirecting to direct scrape:',
      extractedUrls,
    );
    emit(`<research-step type="search" status="started" query="${escapedQuery}" />`);

    const mockSearchResults: SearchResult[] = [];
    for (const url of extractedUrls) {
      const escapedUrl = escapeAttribute(url);
      emit(`<research-step type="browse" status="started" url="${escapedUrl}" />`);
      try {
        const content = await executeScrapePage(url, searchKeys);
        const title = extractTitleFromMarkdown(content, getFriendlyTitleFromUrl(url));
        scrapedDocuments.push({
          url,
          title,
          content: content || 'Failed to extract content from page.',
        });
        mockSearchResults.push({
          title,
          url,
          content: (content || '').substring(0, 1500),
        });
        emit(`<research-step type="browse" status="completed" url="${escapedUrl}" />`);
      } catch (error) {
        console.error(`[DEEP RESEARCH STEP] Direct scrape fallback failed for ${url}:`, error);
        emit(`<research-step type="browse" status="completed" url="${escapedUrl}" />`);
      }
    }

    searchResults.push({ query, results: mockSearchResults });
    emit(
      `<research-step type="search" status="completed" query="${escapedQuery}" /><search-results>${JSON.stringify(mockSearchResults)}</search-results>`,
    );
    return;
  }

  emit(`<research-step type="search" status="started" query="${escapedQuery}" />`);
  try {
    const rawResults = await executeWebSearch(query, searchKeys, 5);
    const results = rankUrlRelevance(query, rawResults).slice(0, 5);
    searchResults.push({ query, results });
    emit(
      `<research-step type="search" status="completed" query="${escapedQuery}" /><search-results>${JSON.stringify(results)}</search-results>`,
    );

    if (scrapeUrls && results.length > 0) {
      const urlsToScrape = results
        .map((result) => result.url)
        .filter((url) => url && !scrapedUrls.has(url))
        .slice(0, 2);

      for (const url of urlsToScrape) {
        scrapedUrls.add(url);
        const escapedUrl = escapeAttribute(url);
        emit(`<research-step type="browse" status="started" url="${escapedUrl}" />`);

        try {
          console.log(`[DEEP RESEARCH STEP] Scraping URL: ${url}`);
          const content = await executeScrapePage(url, searchKeys);
          const title = extractTitleFromMarkdown(
            content,
            results.find((result) => result.url === url)?.title || getFriendlyTitleFromUrl(url),
          );
          scrapedDocuments.push({
            url,
            title,
            content: content || 'Failed to extract content from page.',
          });
          emit(`<research-step type="browse" status="completed" url="${escapedUrl}" />`);
        } catch (error) {
          console.error(`[DEEP RESEARCH STEP] Scraping failed for ${url}:`, error);
          emit(`<research-step type="browse" status="completed" url="${escapedUrl}" />`);
        }
      }
    }
  } catch (error) {
    console.error(`[DEEP RESEARCH STEP] Search failed for query "${query}":`, error);
    emit(`<research-step type="search" status="completed" query="${escapedQuery}" />`);
  }
}

async function executeScrapeStep(
  query: string,
  searchKeys: SearchKeys,
  searchResults: SearchResultBucket[],
  scrapedDocuments: ScrapedDocument[],
  emit: ResearchStreamEmitter,
): Promise<void> {
  const escapedQuery = escapeAttribute(query);
  const cleanQuery = query.trim();
  const extractedUrls = extractUrls(cleanQuery);
  const urlsToScrape = extractedUrls.length > 0 ? extractedUrls : [cleanQuery];

  emit(`<research-step type="search" status="started" query="${escapedQuery}" />`);
  const mockSearchResults: SearchResult[] = [];
  for (const url of urlsToScrape) {
    if (!url || !url.trim()) continue;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }
    const escapedUrl = escapeAttribute(finalUrl);
    emit(`<research-step type="browse" status="started" url="${escapedUrl}" />`);

    try {
      console.log(`[DEEP RESEARCH STEP] Direct scrape URL: ${finalUrl}`);
      const content = await executeScrapePage(finalUrl, searchKeys);
      const title = extractTitleFromMarkdown(content, getFriendlyTitleFromUrl(finalUrl));
      scrapedDocuments.push({
        url: finalUrl,
        title,
        content: content || 'Failed to extract content from page.',
      });
      mockSearchResults.push({
        title,
        url: finalUrl,
        content: (content || '').substring(0, 1500),
      });
      emit(`<research-step type="browse" status="completed" url="${escapedUrl}" />`);
    } catch (error) {
      console.error(`[DEEP RESEARCH STEP] Direct scrape failed for ${finalUrl}:`, error);
      emit(`<research-step type="browse" status="completed" url="${escapedUrl}" />`);
    }
  }

  searchResults.push({ query, results: mockSearchResults });
  emit(
    `<research-step type="search" status="completed" query="${escapedQuery}" /><search-results>${JSON.stringify(mockSearchResults)}</search-results>`,
  );
}

async function executeMapStep(
  query: string,
  searchKeys: SearchKeys,
  searchResults: SearchResultBucket[],
  scrapedDocuments: ScrapedDocument[],
  scrapedUrls: Set<string>,
  emit: ResearchStreamEmitter,
): Promise<void> {
  const escapedQuery = escapeAttribute(query);
  emit(`<research-step type="search" status="started" query="${escapedQuery}" />`);

  try {
    let finalUrl = query.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    console.log(`[DEEP RESEARCH STEP] Mapping site: ${finalUrl}`);
    const links = await executeMapPage(finalUrl, searchKeys, 15);
    console.log(`[DEEP RESEARCH STEP] Mapped links count: ${links.length}`);

    const results = links.map((linkUrl) => ({
      title: getFriendlyTitleFromUrl(linkUrl),
      url: linkUrl,
      content: `Discovered subpage of ${new URL(linkUrl).hostname} via website mapping: ${linkUrl}`,
    }));
    searchResults.push({ query, results });
    emit(
      `<research-step type="search" status="completed" query="${escapedQuery}" /><search-results>${JSON.stringify(results)}</search-results>`,
    );

    const urlsToScrape = links
      .filter((linkUrl) => linkUrl && !scrapedUrls.has(linkUrl))
      .slice(0, 2);
    for (const scrapeUrl of urlsToScrape) {
      scrapedUrls.add(scrapeUrl);
      const escapedUrl = escapeAttribute(scrapeUrl);
      emit(`<research-step type="browse" status="started" url="${escapedUrl}" />`);

      try {
        console.log(`[DEEP RESEARCH STEP] Scraping mapped URL: ${scrapeUrl}`);
        const content = await executeScrapePage(scrapeUrl, searchKeys);
        const title = extractTitleFromMarkdown(content, getFriendlyTitleFromUrl(scrapeUrl));
        scrapedDocuments.push({
          url: scrapeUrl,
          title,
          content: content || 'Failed to extract content from page.',
        });
        emit(`<research-step type="browse" status="completed" url="${escapedUrl}" />`);
      } catch (error) {
        console.error(
          `[DEEP RESEARCH STEP] Scraping mapped URL failed for ${scrapeUrl}:`,
          error,
        );
        emit(`<research-step type="browse" status="completed" url="${escapedUrl}" />`);
      }
    }
  } catch (error) {
    console.error(`[DEEP RESEARCH STEP] Mapping failed for "${query}":`, error);
    emit(`<research-step type="search" status="completed" query="${escapedQuery}" />`);
  }
}

async function executeSocialStep(
  query: string,
  searchKeys: SearchKeys,
  searchResults: SearchResultBucket[],
  emit: ResearchStreamEmitter,
): Promise<void> {
  const escapedQuery = escapeAttribute(query);
  emit(`<research-step type="x" status="started" query="${escapedQuery}" />`);
  try {
    const rawResults = await executeWebSearch(query, searchKeys, 5, true);
    const results = rawResults.slice(0, 5);
    searchResults.push({ query, results });
    emit(
      `<research-step type="x" status="completed" query="${escapedQuery}" /><search-results>${JSON.stringify(results)}</search-results>`,
    );
  } catch (error) {
    console.error(`[DEEP RESEARCH STEP] X search failed for query "${query}":`, error);
    emit(`<research-step type="x" status="completed" query="${escapedQuery}" />`);
  }
}

export async function executeResearchPlan({
  planResult,
  searchKeys,
  emit,
}: ExecuteResearchPlanOptions): Promise<ResearchExecutionResult> {
  const searchResults: SearchResultBucket[] = [];
  const scrapedDocuments: ScrapedDocument[] = [];
  const scrapedUrls = new Set<string>();

  if (!planResult.researchNeeded || planResult.plan.length === 0) {
    return { searchResults, scrapedDocuments };
  }

  for (const step of planResult.plan) {
    console.log(
      `[DEEP RESEARCH STEP] Running step: type=${step.type}, query="${step.query}", scrapeUrls=${step.scrapeUrls}`,
    );

    if (step.type === 'search') {
      await executeSearchStep(
        step.query,
        step.scrapeUrls,
        searchKeys,
        searchResults,
        scrapedDocuments,
        scrapedUrls,
        emit,
      );
    } else if (step.type === 'scrape') {
      await executeScrapeStep(
        step.query,
        searchKeys,
        searchResults,
        scrapedDocuments,
        emit,
      );
    } else if (step.type === 'map') {
      await executeMapStep(
        step.query,
        searchKeys,
        searchResults,
        scrapedDocuments,
        scrapedUrls,
        emit,
      );
    } else if (step.type === 'x') {
      await executeSocialStep(step.query, searchKeys, searchResults, emit);
    }
  }

  return { searchResults, scrapedDocuments };
}
