import { RESEARCH_LIMITS } from './config';
import {
  createDeadlineSignal,
  fetchJsonWithPolicy,
  isAbortError,
} from './request-policy';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface SearchKeys {
  tavilyKey?: string | null;
  exaKey?: string | null;
  firecrawlKey?: string | null;
}

type ScrapeProvider = 'firecrawl' | 'exa';

export interface ScrapeSession {
  preferredProvider: ScrapeProvider;
  consecutiveFailures: Record<ScrapeProvider, number>;
}

export function createScrapeSession(): ScrapeSession {
  return {
    preferredProvider: 'firecrawl',
    consecutiveFailures: { firecrawl: 0, exa: 0 },
  };
}

function getAvailableScrapeProviders(
  keys: SearchKeys,
  session: ScrapeSession,
): ScrapeProvider[] {
  const available: ScrapeProvider[] = [];
  if (keys.firecrawlKey) available.push('firecrawl');
  if (keys.exaKey) available.push('exa');
  if (!available.includes(session.preferredProvider)) return available;
  return [
    session.preferredProvider,
    ...available.filter(provider => provider !== session.preferredProvider),
  ];
}

function recordScrapeFailure(
  session: ScrapeSession,
  provider: ScrapeProvider,
  availableProviders: ScrapeProvider[],
): void {
  session.consecutiveFailures[provider] += 1;
  if (provider !== session.preferredProvider || session.consecutiveFailures[provider] < 2) return;
  const fallback = availableProviders.find(candidate => candidate !== provider);
  if (fallback) {
    session.preferredProvider = fallback;
    console.warn(`[Deep Research] ${provider} is degraded; preferring ${fallback} for subsequent reads.`);
  }
}

function recordScrapeSuccess(session: ScrapeSession, provider: ScrapeProvider): void {
  session.consecutiveFailures[provider] = 0;
}

interface ScrapeCacheEntry {
  content: string;
  expiresAt: number;
}

// Edge isolates may be reused between requests, so keep this cache explicitly
// bounded. Re-inserting a hit gives the Map inexpensive LRU behavior.
const SCRAPE_CACHE = new Map<string, ScrapeCacheEntry>();

function getCachedScrape(url: string): string | null {
  const entry = SCRAPE_CACHE.get(url);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    SCRAPE_CACHE.delete(url);
    return null;
  }
  SCRAPE_CACHE.delete(url);
  SCRAPE_CACHE.set(url, entry);
  return entry.content;
}

function cacheScrape(url: string, content: string): void {
  SCRAPE_CACHE.delete(url);
  SCRAPE_CACHE.set(url, {
    content,
    expiresAt: Date.now() + RESEARCH_LIMITS.SCRAPE_CACHE_TTL_MS,
  });
  while (SCRAPE_CACHE.size > RESEARCH_LIMITS.SCRAPE_CACHE_MAX_ENTRIES) {
    const oldestKey = SCRAPE_CACHE.keys().next().value as string | undefined;
    if (!oldestKey) break;
    SCRAPE_CACHE.delete(oldestKey);
  }
}

// Clean title string utility
function sanitizeTitle(title: string): string {
  return title
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// 1. Tavily Search Wrapper
async function getTavilyResults(
  query: string,
  apiKey: string,
  maxResults = 5,
  isSocial = false,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const body: any = {
    api_key: apiKey,
    query,
    max_results: maxResults,
    search_depth: 'basic',
  };
  if (isSocial) {
    body.include_domains = ['twitter.com', 'x.com', 'reddit.com'];
  }

  const data: any = await fetchJsonWithPolicy('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, {
    label: 'Tavily search',
    timeoutMs: RESEARCH_LIMITS.API_TIMEOUT_MS,
    maxAttempts: RESEARCH_LIMITS.REQUEST_MAX_ATTEMPTS,
    signal,
  });
  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results.map((r: any) => ({
    title: sanitizeTitle(r.title || ''),
    url: r.url || '',
    content: (r.content || '').substring(0, 1500),
  }));
}

// 2. Exa Search Wrapper
async function getExaResults(
  query: string,
  apiKey: string,
  maxResults = 8,
  isSocial = false,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const body: any = {
    query,
    numResults: maxResults,
    contents: {
      highlights: { maxCharacters: 3000 },
    },
  };
  if (isSocial) {
    body.includeDomains = ['twitter.com', 'x.com', 'reddit.com'];
  }

  const data: any = await fetchJsonWithPolicy('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(body),
  }, {
    label: 'Exa search',
    timeoutMs: RESEARCH_LIMITS.API_TIMEOUT_MS,
    maxAttempts: RESEARCH_LIMITS.REQUEST_MAX_ATTEMPTS,
    signal,
  });
  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results.map((r: any) => ({
    title: sanitizeTitle(r.title || ''),
    url: r.url || '',
    content: (
      (r.highlights && Array.isArray(r.highlights) ? r.highlights.join(' ') : '') ||
      (r.text || '')
    ).substring(0, 1500),
  }));
}

// 3. Firecrawl Search Wrapper
async function getFirecrawlResults(
  query: string,
  apiKey: string,
  maxResults = 5,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const data: any = await fetchJsonWithPolicy('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      limit: maxResults,
      scrapeOptions: { formats: ['markdown'] },
    }),
  }, {
    label: 'Firecrawl search',
    timeoutMs: RESEARCH_LIMITS.API_TIMEOUT_MS + 5000,
    maxAttempts: RESEARCH_LIMITS.REQUEST_MAX_ATTEMPTS,
    signal,
  });
  const rawData = data.success && Array.isArray(data.data) ? data.data : Array.isArray(data.data) ? data.data : [];

  return rawData.map((r: any) => ({
    title: sanitizeTitle(r.metadata?.title || r.title || ''),
    url: r.metadata?.sourceURL || r.url || '',
    content: (r.markdown || r.metadata?.description || '').substring(0, 1500),
  }));
}

// Orchestrates Web Search across available keys (Tavily -> Exa -> Firecrawl fallbacks)
export async function executeWebSearch(
  query: string,
  keys: SearchKeys,
  maxResults = 5,
  isSocial = false,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  if (!query || !query.trim()) return [];

  // 1. Tavily
  if (keys.tavilyKey) {
    try {
      return await getTavilyResults(query, keys.tavilyKey, maxResults, isSocial, signal);
    } catch (err: any) {
      if (signal?.aborted || isAbortError(err)) throw err;
      console.warn(`[Deep Research] Tavily search fallback triggered due to: ${err.message}`);
    }
  }

  // 2. Exa
  if (keys.exaKey) {
    try {
      return await getExaResults(query, keys.exaKey, maxResults, isSocial, signal);
    } catch (err: any) {
      if (signal?.aborted || isAbortError(err)) throw err;
      console.warn(`[Deep Research] Exa search fallback triggered due to: ${err.message}`);
    }
  }

  // 3. Firecrawl
  if (keys.firecrawlKey) {
    try {
      return await getFirecrawlResults(query, keys.firecrawlKey, maxResults, signal);
    } catch (err: any) {
      if (signal?.aborted || isAbortError(err)) throw err;
      console.warn(`[Deep Research] Firecrawl search failed: ${err.message}`);
    }
  }

  return [];
}

async function scrapeWithFirecrawl(
  url: string,
  apiKey: string,
  signal: AbortSignal,
): Promise<string> {
  const data: any = await fetchJsonWithPolicy('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
    }),
  }, {
    label: 'Firecrawl scrape',
    timeoutMs: RESEARCH_LIMITS.SCRAPE_TIMEOUT_MS,
    maxAttempts: RESEARCH_LIMITS.REQUEST_MAX_ATTEMPTS,
    retryTimeouts: false,
    signal,
  });
  return data.success && data.data?.markdown ? data.data.markdown.slice(0, 8000) : '';
}

async function scrapeWithExa(
  url: string,
  apiKey: string,
  signal: AbortSignal,
): Promise<string> {
  const data: any = await fetchJsonWithPolicy('https://api.exa.ai/contents', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({ urls: [url], text: true }),
  }, {
    label: 'Exa contents',
    timeoutMs: RESEARCH_LIMITS.SCRAPE_TIMEOUT_MS,
    maxAttempts: RESEARCH_LIMITS.REQUEST_MAX_ATTEMPTS,
    retryTimeouts: false,
    signal,
  });
  return data.results?.[0]?.text ? data.results[0].text.slice(0, 8000) : '';
}

// Reads a page through an adaptive provider chain. Each provider receives its
// own budget so a degraded primary cannot consume the fallback's opportunity.
export async function executeScrapePage(
  url: string,
  keys: SearchKeys,
  signal?: AbortSignal,
  session: ScrapeSession = createScrapeSession(),
): Promise<string> {
  if (!url) return '';

  const cachedContent = getCachedScrape(url);
  if (cachedContent !== null) {
    console.log(`[Deep Research] Cache hit for URL: ${url}`);
    return cachedContent;
  }

  const urlBudget = createDeadlineSignal(signal, RESEARCH_LIMITS.SCRAPE_URL_BUDGET_MS);
  const providers = getAvailableScrapeProviders(keys, session);
  try {
    for (const provider of providers) {
      const providerBudget = createDeadlineSignal(
        urlBudget.signal,
        RESEARCH_LIMITS.SCRAPE_PROVIDER_BUDGET_MS,
      );
      const startedAt = Date.now();
      try {
        console.log(`[Deep Research] Reading via ${provider}: ${url}`);
        const content = provider === 'firecrawl'
          ? await scrapeWithFirecrawl(url, keys.firecrawlKey!, providerBudget.signal)
          : await scrapeWithExa(url, keys.exaKey!, providerBudget.signal);
        if (content) {
          cacheScrape(url, content);
          recordScrapeSuccess(session, provider);
          console.log(
            `[Deep Research] ${provider} read succeeded for ${url} (${content.length} chars, ${Date.now() - startedAt}ms).`,
          );
          return content;
        }
        recordScrapeFailure(session, provider, providers);
        console.warn(`[Deep Research] ${provider} returned no readable content for ${url}.`);
      } catch (err: any) {
        if (urlBudget.signal.aborted) throw err;
        recordScrapeFailure(session, provider, providers);
        console.warn(`[Deep Research] ${provider} read failed for ${url}: ${err.message}`);
      } finally {
        providerBudget.dispose();
      }
    }

    return '';
  } catch (error) {
    if (signal?.aborted) throw error;
    if (urlBudget.didTimeout()) {
      console.warn(`[Deep Research] Scrape budget exhausted for ${url}; continuing with search snippets.`);
      return '';
    }
    throw error;
  } finally {
    urlBudget.dispose();
  }
}

// Local TF-IDF overlapping relevance calculator to rank URL priority
export function rankUrlRelevance(
  query: string,
  results: SearchResult[]
): SearchResult[] {
  if (!query || results.length === 0) return results;

  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  
  const scored = results.map((item) => {
    let score = 0;
    const textToMatch = `${item.title} ${item.content}`.toLowerCase();
    
    queryTerms.forEach((term) => {
      // Direct substring matches
      const occurrences = textToMatch.split(term).length - 1;
      score += occurrences * 2;
      
      // Bonus score if term matches inside URL hostname (denotes primary authoritative source)
      if (item.url.toLowerCase().includes(term)) {
        score += 10;
      }
    });

    return { item, score };
  });

  // Sort descending by calculated match score
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}

// Map website URLs using Firecrawl Map API (v1/map)
export async function executeMapPage(
  url: string,
  keys: SearchKeys,
  limit = 20,
  signal?: AbortSignal,
): Promise<string[]> {
  if (!url) return [];

  // 1. Firecrawl Map API
  if (keys.firecrawlKey) {
    try {
      console.log(`[Deep Research] Mapping URL via Firecrawl: ${url}`);
      const data: any = await fetchJsonWithPolicy('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keys.firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          limit,
        }),
      }, {
        label: 'Firecrawl map',
        timeoutMs: RESEARCH_LIMITS.API_TIMEOUT_MS + 10000,
        maxAttempts: RESEARCH_LIMITS.REQUEST_MAX_ATTEMPTS,
        signal,
      });

      if (data.success && Array.isArray(data.links)) {
        return data.links.slice(0, limit);
      }
      if (Array.isArray(data.links)) {
        return data.links.slice(0, limit);
      }
    } catch (err: any) {
      if (signal?.aborted || isAbortError(err)) throw err;
      console.warn(`[Deep Research] Firecrawl map failed for ${url}: ${err.message}`);
    }
  }

  // 2. Fallback: Exa domain search
  if (keys.exaKey) {
    try {
      console.log(`[Deep Research] Fallback: Mapping URL via Exa domain search: ${url}`);
      let domain = url;
      try {
        domain = new URL(url).hostname;
      } catch {}
      
      const data: any = await fetchJsonWithPolicy('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'x-api-key': keys.exaKey,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          query: `site:${domain}`,
          numResults: limit,
        }),
      }, {
        label: 'Exa map fallback',
        timeoutMs: RESEARCH_LIMITS.API_TIMEOUT_MS,
        maxAttempts: RESEARCH_LIMITS.REQUEST_MAX_ATTEMPTS,
        signal,
      });

      if (data.results && Array.isArray(data.results)) {
        return data.results.map((r: any) => r.url).slice(0, limit);
      }
    } catch (err: any) {
      if (signal?.aborted || isAbortError(err)) throw err;
      console.warn(`[Deep Research] Exa fallback map failed: ${err.message}`);
    }
  }

  return [];
}
