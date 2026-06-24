import { tool } from 'ai';
import { z } from 'zod';
import { executeScrapePage, executeMapPage } from '../research/client';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

interface SearchKeys {
  tavilyKey?: string | null;
  exaKey?: string | null;
  firecrawlKey?: string | null;
}

// Helper to extract root domain name for citation displays
const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

// Clean titles from common clutter
const cleanTitle = (title: string): string => {
  return title
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Deduplicate results by URL and domain to maintain clean contexts
const deduplicateResults = (results: SearchResult[]): SearchResult[] => {
  const seenUrls = new Set<string>();
  const seenDomains = new Set<string>();

  return results.filter((item) => {
    if (!item.url) return false;
    const domain = extractDomain(item.url);
    const isNewUrl = !seenUrls.has(item.url);
    const isNewDomain = !seenDomains.has(domain);

    if (isNewUrl && isNewDomain) {
      seenUrls.add(item.url);
      seenDomains.add(domain);
      return true;
    }
    return false;
  });
};

// Create an AbortSignal that times out after the given milliseconds
const createTimeoutSignal = (ms: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

// 1. Tavily Search Implementation
async function searchTavily(query: string, apiKey: string, maxResults = 6): Promise<SearchResult[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: 'basic',
    }),
    signal: createTimeoutSignal(15000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'unknown error');
    throw new Error(`Tavily API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results.map((r: any) => ({
    title: cleanTitle(r.title || ''),
    url: r.url || '',
    content: (r.content || '').substring(0, 1500)
  }));
}

// 2. Exa Search Implementation
async function searchExa(query: string, apiKey: string, maxResults = 10): Promise<SearchResult[]> {
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      query,
      numResults: maxResults,
      contents: {
        highlights: {
          maxCharacters: 4000
        }
      }
    }),
    signal: createTimeoutSignal(15000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'unknown error');
    throw new Error(`Exa API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results.map((r: any) => ({
    title: cleanTitle(r.title || ''),
    url: r.url || '',
    content: (
      (r.highlights && Array.isArray(r.highlights) ? r.highlights.join(' ') : '') ||
      (r.text || '')
    ).substring(0, 1500)
  }));
}

// 3. Firecrawl Search Implementation
async function searchFirecrawl(query: string, apiKey: string, maxResults = 6): Promise<SearchResult[]> {
  const response = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      limit: maxResults,
      scrapeOptions: {
        formats: ['markdown'],
      }
    }),
    signal: createTimeoutSignal(20000),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'unknown error');
    throw new Error(`Firecrawl API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // Firecrawl v1 returns { success: true, data: [...] }
  if (data.success && Array.isArray(data.data)) {
    return data.data.map((r: any) => ({
      title: cleanTitle(r.metadata?.title || r.title || ''),
      url: r.metadata?.sourceURL || r.url || '',
      content: (r.markdown || r.metadata?.description || '').substring(0, 1500)
    }));
  }

  // Fallback: some versions return { data: [...] } without success field
  if (Array.isArray(data.data)) {
    return data.data.map((r: any) => ({
      title: cleanTitle(r.title || ''),
      url: r.url || '',
      content: (r.markdown || r.description || '').substring(0, 1500)
    }));
  }

  return [];
}

// Helper to check if a query is a direct URL
const isUrl = (str: string): boolean => {
  try {
    const parsed = new URL(str.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Orchestrator: Try Tavily -> Exa -> Firecrawl sequentially (fallback only on failure)
async function executeSearch(query: string, keys: SearchKeys, maxResults = 6): Promise<SearchResult[]> {
  if (!query || !query.trim()) {
    console.log('⚠️ Empty search query, returning empty results immediately.');
    return [];
  }

  // Intercept direct URLs and scrape directly
  if (isUrl(query)) {
    try {
      console.log(`[webSearch] Query is a direct URL. Scraping content directly: ${query}`);
      const content = await executeScrapePage(query, keys);
      let hostname = 'Page';
      try {
        hostname = new URL(query).hostname.replace('www.', '');
      } catch {}
      return [{
        title: `Directly Scraped Page - ${hostname}`,
        url: query.trim(),
        content: (content || 'Failed to extract content from page.').substring(0, 1500)
      }];
    } catch (err: any) {
      console.warn(`[webSearch] Direct URL scraping failed for ${query}, falling back to search:`, err.message);
    }
  }

  // Try Tavily first (primary)
  if (keys.tavilyKey) {
    try {
      console.log('🔍 Executing web search via Tavily...');
      const results = await searchTavily(query, keys.tavilyKey, maxResults);
      if (results && results.length > 0) {
        console.log(`✅ Tavily returned ${results.length} results`);
        return results;
      }
    } catch (err) {
      console.warn('⚠️ Tavily search failed, trying fallback...', (err as Error).message);
    }
  }

  // Fallback to Exa
  if (keys.exaKey) {
    try {
      console.log('🔍 Fallback: Executing web search via Exa...');
      const results = await searchExa(query, keys.exaKey, maxResults);
      if (results && results.length > 0) {
        console.log(`✅ Exa returned ${results.length} results`);
        return results;
      }
    } catch (err) {
      console.warn('⚠️ Exa search failed, trying fallback...', (err as Error).message);
    }
  }

  // Fallback to Firecrawl
  if (keys.firecrawlKey) {
    try {
      console.log('🔍 Fallback: Executing web search via Firecrawl...');
      const results = await searchFirecrawl(query, keys.firecrawlKey, maxResults);
      if (results && results.length > 0) {
        console.log(`✅ Firecrawl returned ${results.length} results`);
        return results;
      }
    } catch (err) {
      console.warn('⚠️ Firecrawl search failed:', (err as Error).message);
    }
  }

  console.warn('❌ All search providers failed or returned no results');
  return [];
}

// Exported Vercel AI SDK Tool
export const createWebSearchTool = (keys: SearchKeys) => {
  return tool({
    description: 'Search the web for real-time information, current events, or factual answers. You MUST provide a non-empty search query. Never pass an empty string as the query.',
    inputSchema: z.object({
      query: z.string().min(1).describe('The search query to look up on the web. Must be a non-empty, meaningful search query.'),
      maxResults: z.number().optional().default(6).describe('The number of search results to return (default: 6).')
    }),
    execute: async ({ query, maxResults }: { query: string; maxResults: number }) => {
      // Reject empty queries with an explicit error message for the model
      if (!query || !query.trim()) {
        return {
          query: '',
          results: [],
          error: 'Empty search query provided. Please provide a specific, non-empty search query.'
        };
      }

      try {
        const rawResults = await executeSearch(query, keys, maxResults);
        const results = deduplicateResults(rawResults);

        // Build a formatted context string the model can directly reference
        const searchContext = results
          .map((r, i) => `[${i + 1}] ${r.title} (${r.url})\n${r.content}`)
          .join('\n\n');

        return {
          query,
          results,
          searchContext: results.length > 0
            ? `Search results for "${query}":\n\n${searchContext}`
            : `No results found for "${query}".`
        };
      } catch (error) {
        console.error('Web search execution error:', error);
        return {
          query,
          results: [],
          error: error instanceof Error ? error.message : 'Unknown search error'
        };
      }
    }
  } as any);
};

export const createBrowsePageTool = (keys: SearchKeys) => {
  return tool({
    description: 'Scrape the full markdown contents of a specific web page URL using Firecrawl or Exa.',
    inputSchema: z.object({
      url: z.string().url().describe('The absolute URL of the web page to scrape.'),
    }),
    execute: async ({ url }: { url: string }) => {
      try {
        const content = await executeScrapePage(url, keys);
        return {
          url,
          content: content || 'Failed to extract content from page.'
        };
      } catch (error) {
        return {
          url,
          error: error instanceof Error ? error.message : 'Unknown scrape error'
        };
      }
    }
  } as any);
};

export const createMapWebsiteTool = (keys: SearchKeys) => {
  return tool({
    description: 'Discover and map all pages and links of a website or URL.',
    inputSchema: z.object({
      url: z.string().url().describe('The base URL of the website to map.'),
      limit: z.number().optional().default(20).describe('Maximum number of URLs/links to return.'),
    }),
    execute: async ({ url, limit }: { url: string; limit: number }) => {
      try {
        const links = await executeMapPage(url, keys, limit);
        return {
          url,
          links,
          resultsContext: links.length > 0
            ? `Discovered ${links.length} pages on ${url}:\n${links.map((link, idx) => `[${idx + 1}] ${link}`).join('\n')}`
            : `No pages found for ${url}.`
        };
      } catch (error) {
        return {
          url,
          error: error instanceof Error ? error.message : 'Unknown map error'
        };
      }
    }
  } as any);
};

