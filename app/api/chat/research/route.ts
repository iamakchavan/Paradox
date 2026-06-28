export const runtime = 'edge';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText, Output, wrapLanguageModel, extractReasoningMiddleware } from 'ai';
import { z } from 'zod';
import { MODELS_REGISTRY } from '@/lib/models';
import { executeWebSearch, executeScrapePage, rankUrlRelevance, executeMapPage } from '@/lib/research/client';

async function resolveAndCleanQuery(
  rawQuery: string,
  formattedMessages: any[],
  aiModel: any
): Promise<string> {
  // 1. First, strip any command prefixes deterministically
  let cleaned = rawQuery.trim();
  cleaned = cleaned.replace(/^(can\s+you\s+)?(please\s+)?(tell\s+me|find|show\s+me|lookup|look\s+up|search\s+for|search|research|query|investigate|do\s+a?\s*deep\s+research)\s+(on|for|about|into|to\s+find|to\s+see)?\s*/i, '');
  cleaned = cleaned.replace(/^["'“”‘’]|["'“”‘’]$/g, '').trim();

  // 2. Determine if it contains pronouns or contextual references
  const pronounRegex = /\b(these|those|they|them|their|it|he|him|his|she|her|hers|this|that|prev|previous|above|authors?|company|companies|model|models|paper|papers|researcher|researchers|person|people|scientist|scientists)\b/i;
  
  if (!pronounRegex.test(cleaned)) {
    return cleaned;
  }

  // 3. If there are pronouns or context indicators, call the model to resolve them
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
    });
    
    let resolved = deRefResponse.text.trim();
    if (resolved) {
      resolved = resolved.replace(/^["'“”‘’]|["'“”‘’]$/g, '').trim();
      resolved = resolved.replace(/^(can\s+you\s+)?(please\s+)?(tell\s+me|find|show\s+me|lookup|look\s+up|search\s+for|search|research|query|investigate|do\s+a?\s*deep\s+research)\s+(on|for|about|into|to\s+find|to\s+see)?\s*/i, '');
      resolved = resolved.replace(/^["'“”‘’]|["'“”‘’]$/g, '').trim();
      
      if (resolved && resolved.length > 5) {
        console.log(`[DEEP RESEARCH PLANNER] Resolved query: "${cleaned}" -> "${resolved}"`);
        return resolved;
      }
    }
  } catch (err) {
    console.error('[DEEP RESEARCH PLANNER] Error in resolveAndCleanQuery:', err);
  }

  return cleaned;
}

function isUrl(str: string): boolean {
  try {
    const parsed = new URL(str.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function extractUrls(str: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = str.match(urlRegex);
  if (!matches) return [];
  return matches.map(url => url.replace(/[.,;?!)]+$/, ''));
}

function extractTitleFromMarkdown(markdown: string, fallback: string): string {
  if (!markdown) return fallback;
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim();
    }
  }
  return fallback;
}

function getFriendlyTitleFromUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.replace('www.', '');
    const pathname = url.pathname.replace(/\/$/, '');
    if (!pathname || pathname === '') {
      return `${hostname} (Home)`;
    }
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    const cleanSegment = lastSegment
      .replace(/[-_]/g, ' ')
      .replace(/\.[a-zA-Z0-9]+$/, '')
      .replace(/\b\w/g, c => c.toUpperCase());
    return `${cleanSegment} - ${hostname}`;
  } catch {
    return urlStr;
  }
}



export async function POST(req: Request) {
  try {
    const { messages, model, systemPrompt } = await req.json();
    console.log(`[DEEP RESEARCH API] Request: model=${model}, messages=${messages?.length}`);

    // Retrieve API keys from client-side forwarded headers
    const geminiKey = req.headers.get('x-api-key-gemini');
    const mistralKey = req.headers.get('x-api-key-mistral');
    const perplexityKey = req.headers.get('x-api-key-perplexity');
    const zenmuxKey = req.headers.get('x-api-key-zenmux');
    const inceptionKey = req.headers.get('x-api-key-inception');
    const nvidiaKey = req.headers.get('x-api-key-nvidia');
    const tavilyKey = req.headers.get('x-api-key-tavily');
    const exaKey = req.headers.get('x-api-key-exa');
    const firecrawlKey = req.headers.get('x-api-key-firecrawl');

    // Find the model configuration in the registry
    const modelConfig = MODELS_REGISTRY.find((m) => m.id === model);
    if (!modelConfig) {
      return new Response(JSON.stringify({ error: `Unsupported model: ${model}` }), { status: 400 });
    }

    // Helper to create a provider model instance
    const createAIModel = (
      config: typeof modelConfig,
      keys: {
        geminiKey: string | null;
        mistralKey: string | null;
        perplexityKey: string | null;
        zenmuxKey: string | null;
        inceptionKey: string | null;
        nvidiaKey: string | null;
      }
    ): any => {
      const baseModel = (() => {
        if (config.provider === 'google') {
          if (!keys.geminiKey) throw new Error('Google Gemini API key is missing');
          return createGoogleGenerativeAI({ apiKey: keys.geminiKey })(config.id);
        } else if (config.provider === 'mistral') {
          if (!keys.mistralKey) throw new Error('Mistral API key is missing');
          return createMistral({ apiKey: keys.mistralKey })(config.id);
        } else if (config.provider === 'perplexity') {
          if (!keys.perplexityKey) throw new Error('Perplexity API key is missing');
          return createOpenAI({
            apiKey: keys.perplexityKey,
            baseURL: 'https://api.perplexity.ai',
          }).chat(config.id);
        } else if (config.provider === 'zenmux') {
          if (!keys.zenmuxKey) throw new Error('ZenMux API key is missing');
          return createOpenAI({
            apiKey: keys.zenmuxKey,
            baseURL: 'https://zenmux.ai/api/v1',
          }).chat(config.id);
        } else if (config.provider === 'inception') {
          if (!keys.inceptionKey) throw new Error('Inception Labs API key is missing');
          return createOpenAI({
            apiKey: keys.inceptionKey,
            baseURL: 'https://api.inceptionlabs.ai/v1',
          }).chat(config.id);
        } else if (config.provider === 'nvidia') {
          if (!keys.nvidiaKey) throw new Error('NVIDIA API key is missing');
          return createOpenAI({
            apiKey: keys.nvidiaKey,
            baseURL: 'https://integrate.api.nvidia.com/v1',
          }).chat(config.id);
        }
        throw new Error(`Unsupported provider: ${config.provider}`);
      })();

      // Wrap OpenAI-compatible models with reasoning extraction middleware to cleanly parse thoughts
      if (
        config.provider === 'nvidia' ||
        config.provider === 'zenmux' ||
        config.provider === 'inception' ||
        config.provider === 'perplexity'
      ) {
        return wrapLanguageModel({
          model: baseModel,
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        });
      }

      return baseModel;
    };

    const providerKeys = { geminiKey, mistralKey, perplexityKey, zenmuxKey, inceptionKey, nvidiaKey };
    const searchKeys = { 
      tavilyKey: tavilyKey || process.env.TAVILY_API_KEY, 
      exaKey: exaKey || process.env.EXA_API_KEY, 
      firecrawlKey: firecrawlKey || process.env.FIRECRAWL_API_KEY 
    };

    let aiModel: any;
    try {
      aiModel = createAIModel(modelConfig, providerKeys);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }

    // Format local messages (including base64 images and PDFs) into Vercel AI SDK content parts
    const formattedMessages = messages.map((msg: any) => {
      const hasImages = msg.images && msg.images.length > 0;
      const hasPDFs = msg.pdfs && msg.pdfs.length > 0;

      let content = msg.content || '';
      
      // Safety: If this is an assistant message and content is empty, provide a non-empty fallback
      // (Mistral completions API rejects empty assistant messages with 400 Bad Request)
      if (msg.role === 'assistant' && !content.trim()) {
        content = '...';
      }

      if (hasImages || hasPDFs) {
        const parts: any[] = [{ type: 'text', text: content }];

        if (hasImages) {
          msg.images.forEach((img: string) => {
            parts.push({ type: 'image', image: img });
          });
        }

        if (hasPDFs) {
          msg.pdfs.forEach((pdf: { name: string; data: string }) => {
            parts.push({ type: 'file', data: pdf.data, mimeType: 'application/pdf' });
          });
        }

        return {
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: parts,
        };
      }

      return {
        role: msg.role === 'user' ? 'user' : 'assistant',
        content,
      };
    });

    console.log("[DEEP RESEARCH] formattedMessages:", JSON.stringify(formattedMessages, null, 2));

    const plannerProviderOptions: Record<string, any> = {};
    if (modelConfig.provider === 'google') {
      plannerProviderOptions.google = {
        thinkingConfig: {
          thinkingBudget: 0,
          includeThoughts: false,
        },
      };
    }
    if (modelConfig.provider === 'zenmux' || modelConfig.provider === 'nvidia') {
      const isReasoningModel = model.includes('glm-5.2') || model.includes('pro') || model.includes('reasoning') || model.includes('gpt-oss') || model.includes('nemotron');
      
      let extraBody: Record<string, any> = {};
      if (model === 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning') {
        extraBody = {
          reasoning_budget: 16384,
          chat_template_kwargs: { enable_thinking: true }
        };
      } else if (model === 'nvidia/nvidia-nemotron-nano-9b-v2') {
        extraBody = {
          min_thinking_tokens: 1024,
          max_thinking_tokens: 2048
        };
      }

      plannerProviderOptions.openai = {
        parallelToolCalls: false,
        ...(isReasoningModel && modelConfig.provider === 'zenmux' ? {
          reasoningEffort: 'medium',
          reasoningSummary: 'detailed',
        } : {}),
        ...(Object.keys(extraBody).length > 0 ? { extraBody } : {}),
      };
    }

    const synthesisProviderOptions: Record<string, any> = {};
    if (modelConfig.provider === 'google') {
      const isReasoningModel = model.includes('pro') || model.includes('3.1') || model.includes('3.5');
      synthesisProviderOptions.google = {
        thinkingConfig: isReasoningModel ? {
          thinkingBudget: 2048,
        } : undefined
      };
    }
    if (modelConfig.provider === 'zenmux' || modelConfig.provider === 'nvidia') {
      const isReasoningModel = model.includes('glm-5.2') || model.includes('pro') || model.includes('reasoning') || model.includes('gpt-oss') || model.includes('nemotron');

      let extraBody: Record<string, any> = {};
      if (model === 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning') {
        extraBody = {
          reasoning_budget: 16384,
          chat_template_kwargs: { enable_thinking: true }
        };
      } else if (model === 'nvidia/nvidia-nemotron-nano-9b-v2') {
        extraBody = {
          min_thinking_tokens: 1024,
          max_thinking_tokens: 2048
        };
      }

      synthesisProviderOptions.openai = {
        parallelToolCalls: false,
        ...(isReasoningModel && modelConfig.provider === 'zenmux' ? {
          reasoningEffort: 'medium',
          reasoningSummary: 'detailed',
        } : {}),
        ...(Object.keys(extraBody).length > 0 ? { extraBody } : {}),
      };
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isControllerClosed = false;
        const safeEnqueue = (data: Uint8Array) => {
          if (!isControllerClosed) {
            try {
              controller.enqueue(data);
            } catch (e) {
              console.warn('[Research Stream] Failed to enqueue (controller likely closed):', e);
              isControllerClosed = true;
            }
          }
        };

        // Force immediate header flush to prevent serverless/proxy/middleware buffering or timeouts
        safeEnqueue(encoder.encode(' '.repeat(2048)));

        // Start a heartbeat interval to keep the stream alive and force proxy/dev-server flushes
        const heartbeatInterval = setInterval(() => {
          try {
            safeEnqueue(encoder.encode(': heartbeat\n\n'));
          } catch (e) {
            clearInterval(heartbeatInterval);
          }
        }, 2000);

        let hasThinkingStarted = false;
        let isReasoningDeltaActive = false;
        const allSearchResultsList: any[] = [];
        const scrapedContentsList: Array<{ url: string; title: string; content: string }> = [];
        const scrapedUrlsSet = new Set<string>();

        try {
          // Stream started planning phase
          safeEnqueue(
            encoder.encode('<research-step type="plan" status="started" />')
          );

          // 1. Generate Structured Research Plan
          let lastUserQuery = '';
          const lastUserMsg = [...formattedMessages].reverse().find((m) => m.role === 'user');
          if (lastUserMsg) {
            if (typeof lastUserMsg.content === 'string') {
              lastUserQuery = lastUserMsg.content;
            } else if (Array.isArray(lastUserMsg.content)) {
              const textPart = lastUserMsg.content.find((p: any) => p.type === 'text');
              lastUserQuery = textPart?.text || '';
            }
          }

          const plannerSystemPrompt = `
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


          let planResult: { researchNeeded: boolean; plan: Array<{ query: string; type: 'search' | 'x' | 'scrape' | 'map'; scrapeUrls: boolean }> } = {
            researchNeeded: false,
            plan: [],
          };

          try {
            console.log('[DEEP RESEARCH PLANNER] Invoking planner model for query:', lastUserQuery);
            const plannerResponse = await generateText({
              model: aiModel,
              system: plannerSystemPrompt,
              messages: formattedMessages,
              output: Output.object({
                schema: z.object({
                  researchNeeded: z.boolean().describe('Whether the user request requires running search tools to get new information.'),
                  plan: z.array(
                    z.object({
                      query: z.string().describe('Search query, URL to scrape, or website to map.'),
                      type: z.enum(['search', 'x', 'scrape', 'map']).describe('Use "search" for standard web search, "x" ONLY when explicitly requested to search social media or Twitter/X/Reddit public opinions, "scrape" for direct page scraping, or "map" ONLY when explicitly requested to discover/map/crawl subpages of a site.'),
                      scrapeUrls: z.boolean().describe('Whether we should crawl and read the full page markdown contents of the top search result URLs.'),
                    })
                  ).max(6).describe('List of sequential research steps. Must be empty if researchNeeded is false. Split multi-entity queries into separate steps, one per entity.'),
                }),
              }),
              providerOptions: plannerProviderOptions,
            });

            planResult = plannerResponse.output;
            console.log('[DEEP RESEARCH PLANNER] Planned:', JSON.stringify(planResult, null, 2));
          } catch (plannerError) {
            console.error('[DEEP RESEARCH PLANNER] Failed to generate structured plan, trying text fallback:', plannerError);
            
            try {
              // Fallback 1: Request raw JSON text string from the model (supported by all models/providers)
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
              });

              const cleanText = textResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanText);
              if (typeof parsed.researchNeeded === 'boolean' && Array.isArray(parsed.plan)) {
                planResult = {
                  researchNeeded: parsed.researchNeeded,
                  plan: parsed.plan.slice(0, 6).map((p: any) => ({
                    query: String(p.query || ''),
                    type: p.type === 'x' ? 'x' : p.type === 'scrape' ? 'scrape' : p.type === 'map' ? 'map' : 'search',
                    scrapeUrls: typeof p.scrapeUrls === 'boolean' ? p.scrapeUrls : true,
                  })),
                };
                console.log('[DEEP RESEARCH PLANNER] Text fallback planned successfully:', JSON.stringify(planResult, null, 2));
              } else {
                throw new Error('Invalid JSON structure in text fallback');
              }
            } catch (fallbackError) {
              console.error('[DEEP RESEARCH PLANNER] Text fallback failed as well, invoking fallback de-referencing query:', fallbackError);
              
              // Fallback 2: Ask the model to de-reference/resolve pronouns directly in a simple text query
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
                });
                if (deRefResponse.text.trim()) {
                  deReferencedQuery = deRefResponse.text.trim().replace(/^"|"$/g, '');
                }
              } catch (deRefErr) {
                console.error('[DEEP RESEARCH PLANNER] Query de-referencing failed:', deRefErr);
              }

              // Clean command prefixes (e.g. "research...", "search for...")
              const cleanSearchQuery = deReferencedQuery.replace(/^(research|search for|lookup|look up)\s+/i, '').trim();

              planResult = {
                researchNeeded: true,
                plan: [{ query: cleanSearchQuery, type: 'search', scrapeUrls: true }],
              };
            }
          }
          
          // Stream completed planning phase
          safeEnqueue(
            encoder.encode(
              `<research-step type="plan" status="completed"${
                !planResult.researchNeeded ? ' query="skipped"' : ''
              } />`
            )
          );

          // Clean/De-reference all queries in the plan
          if (planResult.plan && planResult.plan.length > 0) {
            console.log('[DEEP RESEARCH PLANNER] Pre-cleaning/de-referencing planned queries...');
            planResult.plan = await Promise.all(
              planResult.plan.map(async (step) => {
                const resolvedQuery = await resolveAndCleanQuery(step.query, formattedMessages, aiModel);
                return {
                  ...step,
                  query: resolvedQuery,
                };
              })
            );
            console.log('[DEEP RESEARCH PLANNER] Cleaned plan queries:', JSON.stringify(planResult.plan, null, 2));
          }

          // 2. Execute Research Plan Steps
          if (planResult.researchNeeded && planResult.plan.length > 0) {
            for (const step of planResult.plan) {
              console.log(`[DEEP RESEARCH STEP] Running step: type=${step.type}, query="${step.query}", scrapeUrls=${step.scrapeUrls}`);
              const escapedQuery = step.query ? step.query.replace(/"/g, '&quot;') : '';

              if (step.type === 'search') {
                const extractedUrls = extractUrls(step.query);
                if (extractedUrls.length > 0) {
                  // Intercept URL query in search step and scrape it directly!
                  console.log(`[DEEP RESEARCH STEP] Search query contains URLs. Redirecting to direct scrape:`, extractedUrls);
                  
                  // Stream started search
                  safeEnqueue(
                    encoder.encode(`<research-step type="search" status="started" query="${escapedQuery}" />`)
                  );
                  
                  const mockSearchResults = [];
                  for (const url of extractedUrls) {
                    const escapedUrl = url ? url.replace(/"/g, '&quot;') : '';
                    safeEnqueue(
                      encoder.encode(`<research-step type="browse" status="started" url="${escapedUrl}" />`)
                    );
                    try {
                      const content = await executeScrapePage(url, searchKeys);
                      const title = extractTitleFromMarkdown(content, getFriendlyTitleFromUrl(url));
                      scrapedContentsList.push({
                        url,
                        title,
                        content: content || 'Failed to extract content from page.',
                      });
                      mockSearchResults.push({
                        title,
                        url,
                        content: (content || '').substring(0, 1500),
                      });
                      safeEnqueue(
                        encoder.encode(`<research-step type="browse" status="completed" url="${escapedUrl}" />`)
                      );
                    } catch (e) {
                      console.error(`[DEEP RESEARCH STEP] Direct scrape fallback failed for ${url}:`, e);
                      safeEnqueue(
                        encoder.encode(`<research-step type="browse" status="completed" url="${escapedUrl}" />`)
                      );
                    }
                  }
                  
                  allSearchResultsList.push({ query: step.query, results: mockSearchResults });
                  const resultsString = JSON.stringify(mockSearchResults);
                  safeEnqueue(
                    encoder.encode(`<research-step type="search" status="completed" query="${escapedQuery}" /><search-results>${resultsString}</search-results>`)
                  );
                  continue;
                }

                // Stream started search
                safeEnqueue(
                  encoder.encode(`<research-step type="search" status="started" query="${escapedQuery}" />`)
                );

                try {
                  // Execute search
                  const rawResults = await executeWebSearch(step.query, searchKeys, 5);
                  const results = rankUrlRelevance(step.query, rawResults).slice(0, 5);

                  // Accumulate search results
                  allSearchResultsList.push({ query: step.query, results });

                  // Stream completed search
                  const resultsString = JSON.stringify(results);
                  safeEnqueue(
                    encoder.encode(`<research-step type="search" status="completed" query="${escapedQuery}" /><search-results>${resultsString}</search-results>`)
                  );

                  // Scrape URLs if requested
                  if (step.scrapeUrls && results.length > 0) {
                    const urlsToScrape = results
                      .map((r) => r.url)
                      .filter((url) => url && !scrapedUrlsSet.has(url))
                      .slice(0, 2);

                    for (const url of urlsToScrape) {
                      scrapedUrlsSet.add(url);
                      const escapedUrl = url ? url.replace(/"/g, '&quot;') : '';

                      // Stream started browse
                      safeEnqueue(
                        encoder.encode(`<research-step type="browse" status="started" url="${escapedUrl}" />`)
                      );

                      try {
                        console.log(`[DEEP RESEARCH STEP] Scraping URL: ${url}`);
                        const content = await executeScrapePage(url, searchKeys);
                        const title = extractTitleFromMarkdown(content, results.find((r) => r.url === url)?.title || getFriendlyTitleFromUrl(url));

                        scrapedContentsList.push({
                          url,
                          title,
                          content: content || 'Failed to extract content from page.',
                        });

                        // Stream completed browse
                        safeEnqueue(
                          encoder.encode(`<research-step type="browse" status="completed" url="${escapedUrl}" />`)
                        );
                      } catch (scrapeErr) {
                        console.error(`[DEEP RESEARCH STEP] Scraping failed for ${url}:`, scrapeErr);
                        safeEnqueue(
                          encoder.encode(`<research-step type="browse" status="completed" url="${escapedUrl}" />`)
                        );
                      }
                    }
                  }
                } catch (searchErr) {
                  console.error(`[DEEP RESEARCH STEP] Search failed for query "${step.query}":`, searchErr);
                  safeEnqueue(
                    encoder.encode(`<research-step type="search" status="completed" query="${escapedQuery}" />`)
                  );
                }
              } else if (step.type === 'scrape') {
                const cleanQuery = step.query.trim();
                const extractedUrls = extractUrls(cleanQuery);
                const urlsToScrape = extractedUrls.length > 0 ? extractedUrls : [cleanQuery];

                safeEnqueue(
                  encoder.encode(`<research-step type="search" status="started" query="${escapedQuery}" />`)
                );

                const mockSearchResults = [];
                for (const url of urlsToScrape) {
                  if (!url || !url.trim()) continue;
                  let finalUrl = url.trim();
                  if (!/^https?:\/\//i.test(finalUrl)) {
                    finalUrl = 'https://' + finalUrl;
                  }
                  const escapedUrl = finalUrl.replace(/"/g, '&quot;');

                  safeEnqueue(
                    encoder.encode(`<research-step type="browse" status="started" url="${escapedUrl}" />`)
                  );

                  try {
                    console.log(`[DEEP RESEARCH STEP] Direct scrape URL: ${finalUrl}`);
                    const content = await executeScrapePage(finalUrl, searchKeys);
                    const title = extractTitleFromMarkdown(content, getFriendlyTitleFromUrl(finalUrl));
                    scrapedContentsList.push({
                      url: finalUrl,
                      title,
                      content: content || 'Failed to extract content from page.',
                    });
                    mockSearchResults.push({
                      title,
                      url: finalUrl,
                      content: (content || '').substring(0, 1500)
                    });
                    
                    safeEnqueue(
                      encoder.encode(`<research-step type="browse" status="completed" url="${escapedUrl}" />`)
                    );
                  } catch (e) {
                    console.error(`[DEEP RESEARCH STEP] Direct scrape failed for ${finalUrl}:`, e);
                    safeEnqueue(
                      encoder.encode(`<research-step type="browse" status="completed" url="${escapedUrl}" />`)
                    );
                  }
                }

                allSearchResultsList.push({ query: step.query, results: mockSearchResults });
                const resultsString = JSON.stringify(mockSearchResults);
                safeEnqueue(
                  encoder.encode(`<research-step type="search" status="completed" query="${escapedQuery}" /><search-results>${resultsString}</search-results>`)
                );
              } else if (step.type === 'map') {
                safeEnqueue(
                  encoder.encode(`<research-step type="search" status="started" query="${escapedQuery}" />`)
                );

                try {
                  const url = step.query.trim();
                  let finalUrl = url;
                  if (!/^https?:\/\//i.test(finalUrl)) {
                    finalUrl = 'https://' + finalUrl;
                  }

                  console.log(`[DEEP RESEARCH STEP] Mapping site: ${finalUrl}`);
                  const links = await executeMapPage(finalUrl, searchKeys, 15);
                  console.log(`[DEEP RESEARCH STEP] Mapped links count: ${links.length}`);

                  const results = links.map((linkUrl) => {
                    const title = getFriendlyTitleFromUrl(linkUrl);
                    return {
                      title,
                      url: linkUrl,
                      content: `Discovered subpage of ${new URL(linkUrl).hostname} via website mapping: ${linkUrl}`
                    };
                  });

                  allSearchResultsList.push({ query: step.query, results });

                  const resultsString = JSON.stringify(results);
                  safeEnqueue(
                    encoder.encode(`<research-step type="search" status="completed" query="${escapedQuery}" /><search-results>${resultsString}</search-results>`)
                  );

                  // Scrape the first 2 mapped pages
                  const urlsToScrape = links
                    .filter((linkUrl) => linkUrl && !scrapedUrlsSet.has(linkUrl))
                    .slice(0, 2);

                  for (const scrapeUrl of urlsToScrape) {
                    scrapedUrlsSet.add(scrapeUrl);
                    const escapedUrl = scrapeUrl.replace(/"/g, '&quot;');

                    safeEnqueue(
                      encoder.encode(`<research-step type="browse" status="started" url="${escapedUrl}" />`)
                    );

                    try {
                      console.log(`[DEEP RESEARCH STEP] Scraping mapped URL: ${scrapeUrl}`);
                      const content = await executeScrapePage(scrapeUrl, searchKeys);
                      const title = extractTitleFromMarkdown(content, getFriendlyTitleFromUrl(scrapeUrl));

                      scrapedContentsList.push({
                        url: scrapeUrl,
                        title,
                        content: content || 'Failed to extract content from page.',
                      });

                      safeEnqueue(
                        encoder.encode(`<research-step type="browse" status="completed" url="${escapedUrl}" />`)
                      );
                    } catch (scrapeErr) {
                      console.error(`[DEEP RESEARCH STEP] Scraping mapped URL failed for ${scrapeUrl}:`, scrapeErr);
                      safeEnqueue(
                        encoder.encode(`<research-step type="browse" status="completed" url="${escapedUrl}" />`)
                      );
                    }
                  }
                } catch (mapErr) {
                  console.error(`[DEEP RESEARCH STEP] Mapping failed for "${step.query}":`, mapErr);
                  safeEnqueue(
                    encoder.encode(`<research-step type="search" status="completed" query="${escapedQuery}" />`)
                  );
                }
              } else if (step.type === 'x') {
                // Stream started X search
                safeEnqueue(
                  encoder.encode(`<research-step type="x" status="started" query="${escapedQuery}" />`)
                );

                try {
                  // Execute search (X search falls back to Exa/Tavily queries with isSocial enabled)
                  const rawResults = await executeWebSearch(step.query, searchKeys, 5, true);
                  const results = rawResults.slice(0, 5);

                  allSearchResultsList.push({ query: step.query, results });

                  // Stream completed X search with search results string for the client-side parser
                  const resultsString = JSON.stringify(results);
                  safeEnqueue(
                    encoder.encode(`<research-step type="x" status="completed" query="${escapedQuery}" /><search-results>${resultsString}</search-results>`)
                  );
                } catch (xErr) {
                  console.error(`[DEEP RESEARCH STEP] X search failed for query "${step.query}":`, xErr);
                  safeEnqueue(
                    encoder.encode(`<research-step type="x" status="completed" query="${escapedQuery}" />`)
                  );
                }
              }
            }
          }

          let result;

          if (planResult.researchNeeded) {
            // Stream started synthesis phase
            safeEnqueue(
              encoder.encode('<research-step type="synthesis" status="started" />')
            );

            // 3. Synthesis Phase
            let researchContext = '';
            if (allSearchResultsList.length > 0) {
              researchContext += '### Search Snippets Context:\n\n';
              allSearchResultsList.forEach((sr, idx) => {
                researchContext += `Query "${sr.query}":\n`;
                const results = sr.results || [];
                results.forEach((r: any, rIdx: number) => {
                  researchContext += `[Source ${idx + 1}-${rIdx + 1}] Title: ${r.title} (URL: ${r.url})\nSnippet: ${r.content}\n\n`;
                });
              });
            }

            if (scrapedContentsList.length > 0) {
              researchContext += '### Scraped Full-Page Contents:\n\n';
              scrapedContentsList.forEach((sc, idx) => {
                researchContext += `[Scraped Document ${idx + 1}] Title: ${sc.title} (URL: ${sc.url})\nContent:\n${sc.content.substring(0, 4000)}\n\n`;
              });
            }

            const synthesisSystemPrompt = `
You are Paradox Deep Research, an elite cognitive agent. Today is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', weekday: 'short' })}.

Your goal is to synthesize the collected research results into a highly detailed, professional, and comprehensive final report that directly answers the user's prompt.

RESEARCH CONTEXT GATHERED:
${researchContext || 'No external research was required.'}

INLINE CITATIONS MANDATORY FORMATTING RULES:
1. For any claims supported by the search or scraped documents, add inline citations formatting them as standard Markdown links with the domain name as display text: [domain.com](url). Never use raw URLs, separate bibliography/references/sources sections, or numbered footnotes.
2. If multiple sources support a claim, place them sequentially: [domain1.com](url1) [domain2.com](url2). Do not separate them with pipe characters (|) or commas.
3. Every factual claim, statistic, date, or assertion MUST have an inline citation.

${systemPrompt ? `\nCustom instructions from user:\n${systemPrompt}` : ''}
`;

            const synthesisMessages = [
              ...formattedMessages,
              {
                role: 'assistant' as const,
                content: 'I have completed the deep research phase. Synthesizing the gathered information into a detailed final report...'
              },
              {
                role: 'user' as const,
                content: 'Please synthesize the collected research context into a comprehensive, professional report answering my prompt. Use natural formatting and strictly adhere to the inline citation rules.'
              }
            ];

            console.log('[DEEP RESEARCH SYNTHESIS] Starting streamText for synthesis...');
            result = streamText({
              model: aiModel,
              messages: synthesisMessages,
              system: synthesisSystemPrompt,
              maxRetries: 2,
              providerOptions: synthesisProviderOptions,
            });
          } else {
            console.log('[DEEP RESEARCH] No research needed, streaming standard conversational reply...');
            const conversationalSystemPrompt = `
You are Paradox, an elite cognitive AI assistant.
The user is talking conversationally or no external research is required for their query.
Provide a natural, helpful, and concise response to the user's message.
${systemPrompt ? `\nCustom instructions from user:\n${systemPrompt}` : ''}
`.trim();

            result = streamText({
              model: aiModel,
              messages: formattedMessages,
              system: conversationalSystemPrompt,
              maxRetries: 2,
              providerOptions: synthesisProviderOptions,
            });
          }

          let repetitionBuffer = '';
          let repetitionCount = 0;

          console.log('[DEEP RESEARCH SYNTHESIS] Iterating fullStream...');
          for await (const part of result.fullStream) {
            console.log(`[DEEP RESEARCH SYNTHESIS STREAM] Part type: ${part.type}`);
            if (part.type === 'reasoning-delta') {
              console.log(`[DEEP RESEARCH reasoning-delta] text: "${part.text}"`);
              if (!hasThinkingStarted) {
                safeEnqueue(encoder.encode('<think>'));
                hasThinkingStarted = true;
                isReasoningDeltaActive = true;
              }
              safeEnqueue(encoder.encode(part.text));
            } else if (part.type === 'text-delta') {
              console.log(`[DEEP RESEARCH text-delta] text: "${part.text}"`);
              if (hasThinkingStarted && isReasoningDeltaActive) {
                safeEnqueue(encoder.encode('</think>'));
                hasThinkingStarted = false;
                isReasoningDeltaActive = false;
              }

              const text = part.text;

              if (text.includes('<think>')) {
                hasThinkingStarted = true;
                isReasoningDeltaActive = false;
              }
              if (text.includes('</think>')) {
                hasThinkingStarted = false;
                isReasoningDeltaActive = false;
              }

              // Repetition loop blocker
              if (text === repetitionBuffer && repetitionBuffer.length > 0) {
                repetitionCount++;
                if (repetitionCount > 5) {
                  continue;
                }
              } else {
                repetitionBuffer = text;
                repetitionCount = 0;
              }

              safeEnqueue(encoder.encode(text));
            } else if (part.type === 'error') {
              if (hasThinkingStarted) {
                safeEnqueue(encoder.encode('</think>'));
              }
              console.error('[DEEP RESEARCH SYNTHESIS STREAM ERROR]:', part.error);
              const errMsg = `\n\n⚠️ Error: ${part.error instanceof Error ? part.error.message : String(part.error)}`;
              safeEnqueue(encoder.encode(errMsg));
            }
          }

          if (hasThinkingStarted) {
            safeEnqueue(encoder.encode('</think>'));
          }

          // Stream completed synthesis phase
          if (planResult.researchNeeded) {
            safeEnqueue(
              encoder.encode('<research-step type="synthesis" status="completed" />')
            );
          }

        } catch (err) {
          console.error('[Deep Research Stream Exception]:', err);
          try {
            const errorMessage = err instanceof Error ? err.message : 'Unknown streaming error';
            controller.enqueue(encoder.encode(`\n\n⚠️ Error: ${errorMessage}`));
          } catch {}
        } finally {
          clearInterval(heartbeatInterval);
          try {
            controller.close();
          } catch {}
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Content-Encoding': 'none',
      },
    });
  } catch (error: any) {
    console.error('[Deep Research API] Top-level error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}
