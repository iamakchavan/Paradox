import { RESEARCH_LIMITS } from './config';

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

// Global/session memory cache for scraped page contents to avoid double scraping
const SCRAPE_CACHE = new Map<string, string>();

const createTimeoutSignal = (ms: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

// Defensive request dispatcher with exponential backoff + jitter to combat 429 rate limiting
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delayMs = 1000
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (response.status === 429 && retries > 0) {
      const retryAfter = response.headers.get('retry-after');
      // If header is missing, add randomized jitter (up to 500ms) to spread requests
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delayMs + Math.random() * 500;
      console.warn(`[Deep Research API] Rate limited (429). Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      const waitTime = delayMs + Math.random() * 500;
      console.warn(`[Deep Research API] Request failed. Retrying in ${waitTime}ms...`, error);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return fetchWithRetry(url, options, retries - 1, delayMs * 2);
    }
    throw error;
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
async function getTavilyResults(query: string, apiKey: string, maxResults = 5, isSocial = false): Promise<SearchResult[]> {
  const body: any = {
    api_key: apiKey,
    query,
    max_results: maxResults,
    search_depth: 'basic',
  };
  if (isSocial) {
    body.include_domains = ['twitter.com', 'x.com', 'reddit.com'];
  }

  const response = await fetchWithRetry('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: createTimeoutSignal(RESEARCH_LIMITS.API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Tavily API returned status ${response.status}`);
  }

  const data = await response.json();
  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results.map((r: any) => ({
    title: sanitizeTitle(r.title || ''),
    url: r.url || '',
    content: (r.content || '').substring(0, 1500),
  }));
}

// 2. Exa Search Wrapper
async function getExaResults(query: string, apiKey: string, maxResults = 8, isSocial = false): Promise<SearchResult[]> {
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

  const response = await fetchWithRetry('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(body),
    signal: createTimeoutSignal(RESEARCH_LIMITS.API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Exa API returned status ${response.status}`);
  }

  const data = await response.json();
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
async function getFirecrawlResults(query: string, apiKey: string, maxResults = 5): Promise<SearchResult[]> {
  const response = await fetchWithRetry('https://api.firecrawl.dev/v1/search', {
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
    signal: createTimeoutSignal(RESEARCH_LIMITS.API_TIMEOUT_MS + 5000),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl Search API returned status ${response.status}`);
  }

  const data = await response.json();
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
  isSocial = false
): Promise<SearchResult[]> {
  if (!query || !query.trim()) return [];

  // 1. Tavily
  if (keys.tavilyKey) {
    try {
      return await getTavilyResults(query, keys.tavilyKey, maxResults, isSocial);
    } catch (err: any) {
      console.warn(`[Deep Research] Tavily search fallback triggered due to: ${err.message}`);
    }
  }

  // 2. Exa
  if (keys.exaKey) {
    try {
      return await getExaResults(query, keys.exaKey, maxResults, isSocial);
    } catch (err: any) {
      console.warn(`[Deep Research] Exa search fallback triggered due to: ${err.message}`);
    }
  }

  // 3. Firecrawl
  if (keys.firecrawlKey) {
    try {
      return await getFirecrawlResults(query, keys.firecrawlKey, maxResults);
    } catch (err: any) {
      console.warn(`[Deep Research] Firecrawl search failed: ${err.message}`);
    }
  }

  return [];
}

// Scrape Page contents using Firecrawl or Exa
export async function executeScrapePage(
  url: string,
  keys: SearchKeys
): Promise<string> {
  if (!url) return '';

  // Return cached result if available to save credit count
  if (SCRAPE_CACHE.has(url)) {
    console.log(`[Deep Research] Cache hit for URL: ${url}`);
    return SCRAPE_CACHE.get(url) || '';
  }

  // 1. Firecrawl Scrape API
  if (keys.firecrawlKey) {
    try {
      console.log(`[Deep Research] Scraping via Firecrawl: ${url}`);
      const response = await fetchWithRetry('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keys.firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
        signal: createTimeoutSignal(RESEARCH_LIMITS.SCRAPE_TIMEOUT_MS),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.markdown) {
          const content = data.data.markdown.slice(0, 8000);
          SCRAPE_CACHE.set(url, content);
          return content;
        }
      }
    } catch (err: any) {
      console.warn(`[Deep Research] Firecrawl scrape failed for ${url}: ${err.message}`);
    }
  }

  // 2. Exa Contents API
  if (keys.exaKey) {
    try {
      console.log(`[Deep Research] Fallback: Scraping via Exa Contents: ${url}`);
      const response = await fetchWithRetry('https://api.exa.ai/contents', {
        method: 'POST',
        headers: {
          'x-api-key': keys.exaKey,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          urls: [url],
          text: true,
        }),
        signal: createTimeoutSignal(RESEARCH_LIMITS.SCRAPE_TIMEOUT_MS),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results[0]?.text) {
          const content = data.results[0].text.slice(0, 8000);
          SCRAPE_CACHE.set(url, content);
          return content;
        }
      }
    } catch (err: any) {
      console.warn(`[Deep Research] Exa contents extraction failed for ${url}: ${err.message}`);
    }
  }

  return '';
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
  limit = 20
): Promise<string[]> {
  if (!url) return [];

  // 1. Firecrawl Map API
  if (keys.firecrawlKey) {
    try {
      console.log(`[Deep Research] Mapping URL via Firecrawl: ${url}`);
      const response = await fetchWithRetry('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keys.firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          limit,
        }),
        signal: createTimeoutSignal(RESEARCH_LIMITS.API_TIMEOUT_MS + 10000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.links)) {
          return data.links.slice(0, limit);
        }
        if (Array.isArray(data.links)) {
          return data.links.slice(0, limit);
        }
      } else {
        console.warn(`[Deep Research] Firecrawl Map API returned status ${response.status}`);
      }
    } catch (err: any) {
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
      
      const response = await fetchWithRetry('https://api.exa.ai/search', {
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
        signal: createTimeoutSignal(RESEARCH_LIMITS.API_TIMEOUT_MS),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && Array.isArray(data.results)) {
          return data.results.map((r: any) => r.url).slice(0, limit);
        }
      }
    } catch (err: any) {
      console.warn(`[Deep Research] Exa fallback map failed: ${err.message}`);
    }
  }

  return [];
}

