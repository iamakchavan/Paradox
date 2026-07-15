import { generateText, Output } from 'ai';
import { z } from 'zod';
import { isAbortError } from '@/lib/research/request-policy';
import { serializeResearchEvent } from '@/lib/research/events';
import type {
  ResearchPlanResult,
  ResearchStreamEmitter,
} from './types';

interface PlanResearchOptions {
  formattedMessages: any[];
  aiModel: any;
  providerOptions: Record<string, any>;
  emit: ResearchStreamEmitter;
  signal?: AbortSignal;
}

const QUERY_PREFIX =
  /^(can\s+you\s+)?(please\s+)?(tell\s+me|find|show\s+me|lookup|look\s+up|search\s+for|search|research|query|investigate|do\s+a?\s*deep\s+research)\s+(on|for|about|into|to\s+find|to\s+see)?\s*/i;
const EDGE_QUOTES = /^["'“”‘’]|["'“”‘’]$/g;

function cleanInitialQuery(query: string): string {
  return query.trim().replace(QUERY_PREFIX, '').replace(EDGE_QUOTES, '').trim();
}

function cleanResolvedQuery(query: string): string {
  return query
    .trim()
    .replace(EDGE_QUOTES, '')
    .trim()
    .replace(QUERY_PREFIX, '')
    .replace(EDGE_QUOTES, '')
    .trim();
}

async function resolveAndCleanQuery(
  rawQuery: string,
  formattedMessages: any[],
  aiModel: any,
  signal?: AbortSignal,
): Promise<string> {
  const cleaned = cleanInitialQuery(rawQuery);
  const pronounRegex =
    /\b(these|those|they|them|their|it|he|him|his|she|her|hers|this|that|prev|previous|above|authors?|company|companies|model|models|paper|papers|researcher|researchers|person|people|scientist|scientists)\b/i;

  if (!pronounRegex.test(cleaned)) {
    return cleaned;
  }

  try {
    const deRefPrompt = `
Analyze the conversation history and the latest user query: "${cleaned}"
Your job is to resolve any pronouns or context indicators (such as "these authors", "they", "their", "this company", "that paper", "it") into specific, self-contained entities and proper nouns (e.g. specific names, paper titles, company names) using the context from the conversation history.

Rules:
1. Output ONLY the resolved, self-contained search query.
2. Do NOT include markdown formatting, quotes, preambles (like "Resolved query:"), or explanations. Just output the clean query text.
3. Keep the query search-engine friendly, detailed, and focused.
4. If no pronouns/references can be resolved or if they are not in the history, output the original query as-is.
`;
    console.log('[DEEP RESEARCH PLANNER] Resolving pronouns for query:', cleaned);
    const deRefResponse = await generateText({
      model: aiModel,
      system: deRefPrompt,
      messages: formattedMessages,
      abortSignal: signal,
    });

    const resolved = cleanResolvedQuery(deRefResponse.text);
    if (resolved && resolved.length > 5) {
      console.log(`[DEEP RESEARCH PLANNER] Resolved query: "${cleaned}" -> "${resolved}"`);
      return resolved;
    }
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.error('[DEEP RESEARCH PLANNER] Error in resolveAndCleanQuery:', error);
  }

  return cleaned;
}

function getLastUserQuery(formattedMessages: any[]): string {
  const lastUserMessage = [...formattedMessages].reverse().find((message) => message.role === 'user');
  if (!lastUserMessage) return '';
  if (typeof lastUserMessage.content === 'string') return lastUserMessage.content;
  if (Array.isArray(lastUserMessage.content)) {
    const textPart = lastUserMessage.content.find((part: any) => part.type === 'text');
    return textPart?.text || '';
  }
  return '';
}

function buildPlannerSystemPrompt(): string {
  return `
You are Paradox Deep Research Planner. Today's date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', weekday: 'short' })}.
Your job is to analyze the conversation history and the latest user query, determine if external web research is needed, and generate a research plan.

Instructions:
1. Determine if "researchNeeded" should be true or false.
   - Set "researchNeeded" to false if the user query is a simple greeting (e.g., "hi", "hello", "thanks", "thank you", "hey").
   - Set "researchNeeded" to false if the query asks to format, summarize, translate, or explain information that is ALREADY fully present in previous messages in the history.
   - Set "researchNeeded" to true if answering the query requires looking up new information, news, current events, documentation, or facts not present in the history.
2. If "researchNeeded" is true, generate a "plan" with 1 to 6 distinct steps.
   - Each step has a "query". For search, this is a detailed search query. For scrape or map, this is the exact URL.
   - Set "type" to:
     - "search" for standard web search.
     - "x" ONLY when the user prompt explicitly asks for social media discussions, opinions, Twitter/X posts, reddit threads/posts, or public feedback/breaking news. NEVER plan "x" steps unless the user explicitly requests searching social networks or user opinions.
     - "scrape" to directly read/scrape the full contents of specific URL(s) provided by the user.
     - "map" ONLY when the user explicitly/specifically asks to map the website, discover pages/subpages of the site, or crawl/find other pages on the website (e.g., "map this site", "check pages on site x"). NEVER use "map" unless explicitly requested.
   - Set "scrapeUrls" to true if we need to read the full page contents of the top results (for "search" steps). For "scrape" or "map", set this to true.
3. De-reference pronouns and context:
   - You MUST resolve all pronouns and context indicators (e.g., "these authors", "what are they doing", "that company", "their new model") into specific entities and proper nouns (e.g., specific names, paper titles, company names) using the conversation history.
   - Search queries MUST be self-contained and descriptive, containing the exact proper names or entities being searched. Never repeat generic pronouns or user commands like "research..." in the search queries.
4. CRITICAL - Split multi-entity queries into separate steps:
   - When the user asks about MULTIPLE distinct entities (e.g., multiple people, multiple companies, multiple papers), you MUST create a SEPARATE step for EACH entity.
   - Example: If asked "what are the authors of Attention Is All You Need doing now?" and there are 8 authors, create one step per author (e.g., "Ashish Vaswani current role 2026", "Noam Shazeer current company 2026", "Niki Parmar current work 2026", etc.).
   - NEVER combine multiple people/entities into a single search query. Each entity gets its own focused query for better search results.
   - Prioritize the most notable entities if there are too many (limit to 6 steps max).
5. Direct Scraping & Website Mapping:
   - If the user query provides a specific URL or asks to read/summarize a specific URL, you MUST create a step with type "scrape" and set "query" to the exact URL. Do NOT use standard "search" queries for specific URLs.
   - You MUST use the "map" step type ONLY when the user specifically and explicitly requests mapping the site or exploring other subpages of the site (e.g. "map x.com", "discover pages on y.org", "find other pages"). If they just provide a URL and ask about its contents, use "scrape" instead.
   - CONTEXT CHECK: Check conversation history context. If a list of links from a previous map or scrape step is already present in the history, and the user asks a follow-up question about a specific subpage (e.g. "what does their privacy policy say?", "check the contact page"), you MUST create a step with type "scrape" using the matching URL from the history. Do NOT plan search or map steps.
   - If the user asks to "scrape all mapped pages" or "read all of them", create separate "scrape" steps for each of the mapped URLs from the history context (up to the limit of 6 steps).
`;
}

async function generatePlan(
  lastUserQuery: string,
  formattedMessages: any[],
  aiModel: any,
  plannerSystemPrompt: string,
  providerOptions: Record<string, any>,
  signal?: AbortSignal,
): Promise<ResearchPlanResult> {
  try {
    console.log('[DEEP RESEARCH PLANNER] Invoking planner model for query:', lastUserQuery);
    const plannerResponse = await generateText({
      model: aiModel,
      system: plannerSystemPrompt,
      messages: formattedMessages,
      output: Output.object({
        schema: z.object({
          researchNeeded: z
            .boolean()
            .describe('Whether the user request requires running search tools to get new information.'),
          plan: z
            .array(
              z.object({
                query: z.string().describe('Search query, URL to scrape, or website to map.'),
                type: z
                  .enum(['search', 'x', 'scrape', 'map'])
                  .describe(
                    'Use "search" for standard web search, "x" ONLY when explicitly requested to search social media or Twitter/X/Reddit public opinions, "scrape" for direct page scraping, or "map" ONLY when explicitly requested to discover/map/crawl subpages of a site.',
                  ),
                scrapeUrls: z
                  .boolean()
                  .describe(
                    'Whether we should crawl and read the full page markdown contents of the top search result URLs.',
                  ),
              }),
            )
            .max(6)
            .describe(
              'List of sequential research steps. Must be empty if researchNeeded is false. Split multi-entity queries into separate steps, one per entity.',
            ),
        }),
      }),
      providerOptions,
      abortSignal: signal,
    });

    console.log('[DEEP RESEARCH PLANNER] Planned:', JSON.stringify(plannerResponse.output, null, 2));
    return plannerResponse.output;
  } catch (plannerError) {
    if (isAbortError(plannerError)) throw plannerError;
    console.error(
      '[DEEP RESEARCH PLANNER] Failed to generate structured plan, trying text fallback:',
      plannerError,
    );
  }

  try {
    const textPlannerPrompt = `
${plannerSystemPrompt}

You MUST output your response in raw JSON format matching this schema:
{
  "researchNeeded": boolean,
  "plan": [
    {
      "query": "string (the de-referenced query, URL to scrape, or website to map)",
      "type": "search" | "x" | "scrape" | "map",
      "scrapeUrls": boolean
    }
  ]
}
Do NOT include markdown formatting, markdown code blocks (such as \`\`\`json), or any explanations. Just output raw valid JSON text.
`;
    const textResponse = await generateText({
      model: aiModel,
      system: textPlannerPrompt,
      messages: formattedMessages,
      abortSignal: signal,
    });

    const cleanText = textResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    if (typeof parsed.researchNeeded !== 'boolean' || !Array.isArray(parsed.plan)) {
      throw new Error('Invalid JSON structure in text fallback');
    }

    const planResult: ResearchPlanResult = {
      researchNeeded: parsed.researchNeeded,
      plan: parsed.plan.slice(0, 6).map((step: any) => ({
        query: String(step.query || ''),
        type:
          step.type === 'x'
            ? 'x'
            : step.type === 'scrape'
              ? 'scrape'
              : step.type === 'map'
                ? 'map'
                : 'search',
        scrapeUrls: typeof step.scrapeUrls === 'boolean' ? step.scrapeUrls : true,
      })),
    };
    console.log(
      '[DEEP RESEARCH PLANNER] Text fallback planned successfully:',
      JSON.stringify(planResult, null, 2),
    );
    return planResult;
  } catch (fallbackError) {
    if (isAbortError(fallbackError)) throw fallbackError;
    console.error(
      '[DEEP RESEARCH PLANNER] Text fallback failed as well, invoking fallback de-referencing query:',
      fallbackError,
    );
  }

  let deReferencedQuery = lastUserQuery.trim();
  try {
    const deRefPrompt = `
Analyze this user query: "${lastUserQuery}"
And the conversation history.
Your job is to resolve any pronouns (like "these authors", "it", "they") in the user query into specific names/terms using the context from the conversation history, and return a clean, self-contained search query.

Rules:
- Output ONLY the clean, self-contained search query text.
- Do not include "search for...", quote marks, or explanations.
- If no pronouns or context need resolution, output the original query.
`;
    const deRefResponse = await generateText({
      model: aiModel,
      system: deRefPrompt,
      messages: formattedMessages,
      abortSignal: signal,
    });
    if (deRefResponse.text.trim()) {
      deReferencedQuery = deRefResponse.text.trim().replace(/^"|"$/g, '');
    }
  } catch (deRefError) {
    if (isAbortError(deRefError)) throw deRefError;
    console.error('[DEEP RESEARCH PLANNER] Query de-referencing failed:', deRefError);
  }

  const cleanSearchQuery = deReferencedQuery
    .replace(/^(research|search for|lookup|look up)\s+/i, '')
    .trim();
  return {
    researchNeeded: true,
    plan: [{ query: cleanSearchQuery, type: 'search', scrapeUrls: true }],
  };
}

export async function planResearch({
  formattedMessages,
  aiModel,
  providerOptions,
  emit,
  signal,
}: PlanResearchOptions): Promise<ResearchPlanResult> {
  emit(serializeResearchEvent({ type: 'plan', status: 'started', id: 'research-plan', order: -1 }));

  const lastUserQuery = getLastUserQuery(formattedMessages);
  const planResult = await generatePlan(
    lastUserQuery,
    formattedMessages,
    aiModel,
    buildPlannerSystemPrompt(),
    providerOptions,
    signal,
  );

  emit(serializeResearchEvent({
    type: 'plan',
    status: 'completed',
    id: 'research-plan',
    order: -1,
    query: !planResult.researchNeeded ? 'skipped' : undefined,
  }));

  if (planResult.plan.length > 0) {
    console.log('[DEEP RESEARCH PLANNER] Pre-cleaning/de-referencing planned queries...');
    planResult.plan = await Promise.all(
      planResult.plan.map(async (step) => ({
        ...step,
        query: await resolveAndCleanQuery(step.query, formattedMessages, aiModel, signal),
      })),
    );
    console.log(
      '[DEEP RESEARCH PLANNER] Cleaned plan queries:',
      JSON.stringify(planResult.plan, null, 2),
    );
  }

  return planResult;
}
