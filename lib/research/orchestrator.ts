import { tool, LanguageModel } from 'ai';
import { z } from 'zod';
import { executeWebSearch, executeScrapePage, rankUrlRelevance, SearchKeys } from './client';
import { RESEARCH_LIMITS } from './config';

export interface ResearchOptions {
  messages: any[];
  model: LanguageModel;
  keys: SearchKeys;
}

export async function createResearchStream({
  messages,
  model,
  keys
}: ResearchOptions) {
  // Define separate tools with strict bounds to protect limits
  const webSearchTool = tool({
    description: 'Search the web using Tavily or Exa for real-time information or news on a specific query.',
    inputSchema: z.object({
      query: z.string().min(1).describe('The search query. Must be specific and non-empty.'),
    }),
    execute: async ({ query }) => {
      try {
        const rawResults = await executeWebSearch(query, keys);
        const results = rankUrlRelevance(query, rawResults).slice(0, 5); // Limit to top 5 results

        // Format search results context block
        const context = results
          .map((r, i) => `[Source ${i + 1}]: ${r.title} (${r.url})\nSnippet: ${r.content}`)
          .join('\n\n');

        return {
          query,
          results,
          searchContext: results.length > 0
            ? `Search results for "${query}":\n\n${context}`
            : `No results found for "${query}".`
        };
      } catch (error) {
        return {
          query,
          results: [],
          error: error instanceof Error ? error.message : 'Unknown search error'
        };
      }
    }
  });

  const browsePageTool = tool({
    description: 'Scrape the full markdown contents of a specific web page URL using Firecrawl or Exa.',
    inputSchema: z.object({
      url: z.string().url().describe('The absolute URL of the web page to scrape.'),
    }),
    execute: async ({ url }) => {
      try {
        const markdown = await executeScrapePage(url, keys);
        return {
          url,
          content: markdown || 'Failed to extract content from page.'
        };
      } catch (error) {
        return {
          url,
          error: error instanceof Error ? error.message : 'Unknown scrape error'
        };
      }
    }
  });

  const xSearchTool = tool({
    description: 'Search Twitter/X posts to find real-time opinions, social feedback, or breaking tweets.',
    inputSchema: z.object({
      query: z.string().min(1).describe('Search query for Twitter/X posts.'),
    }),
    execute: async ({ query }) => {
      try {
        // Exa supports category filtering specifically for tweets
        const rawResults = keys.exaKey 
          ? await executeWebSearch(query, { exaKey: keys.exaKey }, 5)
          : await executeWebSearch(query, keys, 5);
        
        return {
          query,
          results: rawResults
        };
      } catch (error) {
        return {
          query,
          results: [],
          error: error instanceof Error ? error.message : 'Unknown social search error'
        };
      }
    }
  });

  // Construct context-sufficiency prompt instruction
  const deepResearchSystemPrompt = `
You are Paradox Deep Research, an elite cognitive agent. Your goal is to conduct exhaustive research by utilizing tools and synthesizing a detailed, cited final report.

You have access to separate tools to gather external knowledge:
- 'webSearch': Discover relevant links and information snippets.
- 'browsePage': Read the full text contents of a target web page (e.g. documentation, articles).
- 'xSearch': Discover Twitter/X social discussions and posts.

CONSTRAINTS & DYNAMIC ACTIVATION (API CONSERVATION):
1. GREETING EXCEPTION: If the user query is a simple greeting ("hi", "hello"), reply directly. DO NOT use search tools.
2. CONTEXT SUFFICIENCY: Before calling any search tool, check the conversation history. If the query asks to format, summarize, translate, or explain information that is ALREADY fully present in previous messages, YOU MUST NOT call any tools. Answer directly using existing context.
3. MINIMAL TOOL CALLS: Call tools only when new external knowledge is genuinely required to answer.
4. INLINE CITATIONS: For any claims supported by web search, add inline citations formatting them as standard Markdown links with the domain name as display text: [domain.com](url). Never use raw URLs, separate bibliography sections, or numbered footnotes.
`;

  return {
    model,
    messages,
    system: deepResearchSystemPrompt,
    tools: {
      webSearch: webSearchTool,
      browsePage: browsePageTool,
      xSearch: xSearchTool
    },
    toolChoice: 'auto' as const,
    maxSteps: RESEARCH_LIMITS.MAX_AGENT_STEPS, // up to 10 steps max
  };
}
