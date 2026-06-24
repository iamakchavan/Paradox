import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, wrapLanguageModel, extractReasoningMiddleware } from 'ai';
import { MODELS_REGISTRY } from '@/lib/models';
import { createWebSearchTool, createBrowsePageTool, createMapWebsiteTool } from '@/lib/tools/web-search';

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
    console.log(`[CHAT] Request: model=${model}, messages=${messages?.length}, search=${req.headers.get('x-search-enabled')}`);

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
    const searchEnabled = req.headers.get('x-search-enabled') === 'true';

    // Find the model configuration in the registry
    const modelConfig = MODELS_REGISTRY.find(m => m.id === model);
    if (!modelConfig) {
      console.error(`[CHAT] Model not found: ${model}`);
      return new Response(JSON.stringify({ error: `Unsupported model: ${model}` }), { status: 400 });
    }

    // Helper to create a provider model instance
    const createAIModel = (config: typeof modelConfig, keys: {
      geminiKey: string | null; mistralKey: string | null;
      perplexityKey: string | null; zenmuxKey: string | null;
      inceptionKey: string | null; nvidiaKey: string | null;
    }): any => {
      if (config!.provider === 'google') {
        if (!keys.geminiKey) throw new Error('Google Gemini API key is missing');
        return createGoogleGenerativeAI({ apiKey: keys.geminiKey })(config!.id);
      } else if (config!.provider === 'mistral') {
        if (!keys.mistralKey) throw new Error('Mistral API key is missing');
        return createMistral({ apiKey: keys.mistralKey })(config!.id);
      } else if (config!.provider === 'perplexity') {
        if (!keys.perplexityKey) throw new Error('Perplexity API key is missing');
        return createOpenAI({
          apiKey: keys.perplexityKey,
          baseURL: 'https://api.perplexity.ai',
        }).chat(config!.id);
      } else if (config!.provider === 'zenmux') {
        if (!keys.zenmuxKey) throw new Error('ZenMux API key is missing');
        return createOpenAI({
          apiKey: keys.zenmuxKey,
          baseURL: 'https://zenmux.ai/api/v1',
        }).chat(config!.id);
      } else if (config!.provider === 'inception') {
        if (!keys.inceptionKey) throw new Error('Inception Labs API key is missing');
        return createOpenAI({
          apiKey: keys.inceptionKey,
          baseURL: 'https://api.inceptionlabs.ai/v1',
        }).chat(config!.id);
      } else if (config!.provider === 'nvidia') {
        if (!keys.nvidiaKey) throw new Error('NVIDIA API key is missing');
        return createOpenAI({
          apiKey: keys.nvidiaKey,
          baseURL: 'https://integrate.api.nvidia.com/v1',
        }).chat(config!.id);
      }
      throw new Error(`Unsupported provider: ${config!.provider}`);
    };

    const providerKeys = { geminiKey, mistralKey, perplexityKey, zenmuxKey, inceptionKey, nvidiaKey };

    let aiModel: any;
    try {
      aiModel = createAIModel(modelConfig, providerKeys);
    } catch (err: any) {
      console.error(`[CHAT] Model creation failed: ${err.message}`);
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

    // Determine if the model can use web search tools
    const hasSearchKeys = !!tavilyKey || !!exaKey || !!firecrawlKey || !!process.env.TAVILY_API_KEY || !!process.env.EXA_API_KEY || !!process.env.FIRECRAWL_API_KEY;
    const canUseTools = modelConfig.provider !== 'perplexity' && hasSearchKeys && searchEnabled;
    console.log(`[CHAT] canUseTools=${canUseTools}, hasSearchKeys=${hasSearchKeys}, searchEnabled=${searchEnabled}, provider=${modelConfig.provider}`);

    let finalSystemPrompt = systemPrompt || '';
    if (canUseTools) {
      const searchInstruction = `
You have access to separate tools to gather external knowledge:
- 'webSearch': Search the web for real-time information, current events, or factual answers.
- 'browsePage': Read the full markdown contents of a specific web page URL (e.g. documentation, articles, blog posts). Use this when the user provides a specific URL or when you need to read a target page's detailed text.
- 'mapWebsite': Discover and map the subpages and links of a website or base URL. Use this if the user asks you to find other pages or map a website.

IMPORTANT RULES:
- Always provide proper non-empty inputs to tools.
- After receiving results, you MUST synthesize the information into a comprehensive, well-structured answer with inline citations.
- Format citations as standard Markdown links with the domain name as link text (e.g., [nytimes.com](https://www.nytimes.com/article)).
- Do NOT output raw URLs, footnotes, or repeated domain names in text.
- If multiple sources support a claim, cite them sequentially: [source1.com](url1) [source2.com](url2).
- CONTEXT CHECK: Look at the conversation history before calling any tool. If a list of links (e.g. from a previous mapWebsite or scrape result) is already present in the history, and the user asks a question about a specific page or section (e.g. "what does their privacy page say?", "check their terms"), do NOT perform a general web search or map the site again. Instead, identify the specific URL from the history context and call 'browsePage' directly on that URL.
- If the user asks to "scrape all pages" or "read all pages" from the mapped list, you can execute 'browsePage' on multiple mapped links sequentially (this system supports multi-step execution).
`;
      finalSystemPrompt = (finalSystemPrompt + '\n' + searchInstruction).trim();
    }

    const searchKeysObj = {
      tavilyKey: tavilyKey || process.env.TAVILY_API_KEY,
      exaKey: exaKey || process.env.EXA_API_KEY,
      firecrawlKey: firecrawlKey || process.env.FIRECRAWL_API_KEY,
    };

    const searchToolInstance = canUseTools ? createWebSearchTool(searchKeysObj) : null;
    const browseToolInstance = canUseTools ? createBrowsePageTool(searchKeysObj) : null;
    const mapToolInstance = canUseTools ? createMapWebsiteTool(searchKeysObj) : null;

    const toolsConfig = canUseTools && searchToolInstance ? {
      tools: {
        webSearch: searchToolInstance,
        browsePage: browseToolInstance!,
        mapWebsite: mapToolInstance!,
      },
      toolChoice: 'auto' as const,
      maxSteps: 5,
      onStepFinish: ({ text, toolCalls, toolResults, finishReason }: any) => {
        console.log(`[CHAT Step Finish] reason=${finishReason}, textLength=${text?.length || 0}, toolCalls=${toolCalls?.length || 0}, toolResults=${toolResults?.length || 0}`);
      },
      prepareStep: async ({ steps }: { steps: any[] }) => {
        if (steps.length === 0) {
          return { toolChoice: 'auto' as const };
        }
        if (steps.length >= 5) {
          return { toolChoice: 'none' as const, activeTools: [] };
        }

        // Prevent exact duplicate tool calls in previous steps to block infinite loops
        const lastStep = steps[steps.length - 1];
        if (lastStep && lastStep.toolCalls) {
          const isDuplicate = steps.slice(0, -1).some(prevStep => 
            prevStep.toolCalls?.some((prevTc: any) => 
              lastStep.toolCalls.some((currTc: any) => 
                prevTc.toolName === currTc.toolName && 
                JSON.stringify(prevTc.args) === JSON.stringify(currTc.args)
              )
            )
          );
          if (isDuplicate) {
            console.log('[CHAT prepareStep] Duplicate tool call detected. Aborting tools to prevent loops.');
            return {
              toolChoice: 'none' as const,
              activeTools: [],
            };
          }
        }

        return { toolChoice: 'auto' as const };
      },
    } : {};

    console.log(`[CHAT] Starting streamText with tools: ${Object.keys(toolsConfig).join(', ') || 'none'}`);

    const providerOptions: Record<string, any> = {};

    if (modelConfig.provider === 'google') {
      const isReasoningModel = model.includes('pro') || model.includes('3.1') || model.includes('3.5');
      providerOptions.google = {
        thinkingConfig: isReasoningModel ? {
          thinkingBudget: canUseTools ? 0 : 2048,
        } : undefined
      };
    }

    if (modelConfig.provider === 'zenmux') {
      const isReasoningModel = model.includes('glm-5.2') || model.includes('pro') || model.includes('reasoning');
      providerOptions.openai = {
        parallelToolCalls: false,
        ...(isReasoningModel ? {
          reasoningEffort: 'medium',
          reasoningSummary: 'detailed',
        } : {}),
      };
    }

    const result = streamText({
      model: aiModel,
      messages: formattedMessages,
      system: finalSystemPrompt || undefined,
      maxRetries: 2,
      includeRawChunks: true,
      ...toolsConfig,
      providerOptions,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let isControllerClosed = false;
        const safeEnqueue = (data: Uint8Array) => {
          if (!isControllerClosed) {
            try {
              controller.enqueue(data);
            } catch {
              isControllerClosed = true;
            }
          }
        };

        // Force immediate header flush — prevents proxy/middleware buffering
        safeEnqueue(encoder.encode(' '.repeat(2048)));

        // Heartbeat: keeps the mobile connection alive during tool calls
        // (web search + browsePage can take 5–15s each, enough for iOS Safari
        // to consider the connection idle and kill it)
        const heartbeatInterval = setInterval(() => {
          safeEnqueue(encoder.encode(' '));
        }, 500);

        let hasThinkingStarted = false;
        let isReasoningDeltaActive = false;
        let gotSearchResults = false;
        let gotTextAfterSearch = false;
        let lastSearchResultData: any = null;
        let repetitionBuffer = '';
        let repetitionCount = 0;
        const accumulatedCitations = new Set<string>();

        try {
          for await (const part of result.fullStream) {
            console.log(`[CHAT] Part type: ${part.type}`);
            if (part.type === 'reasoning-delta') {
              console.log(`[CHAT reasoning-delta] text: "${part.text}"`);
              if (!hasThinkingStarted) {
                safeEnqueue(encoder.encode('<think>'));
                hasThinkingStarted = true;
                isReasoningDeltaActive = true;
              }
              safeEnqueue(encoder.encode(part.text));

            } else if (part.type === 'text-delta') {
              console.log(`[CHAT text-delta] text: "${part.text}"`);
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

              if (gotSearchResults && text.trim().length > 0) {
                gotTextAfterSearch = true;
              }

            } else if (part.type === 'tool-input-delta') {
              console.log(`[CHAT] Tool input delta: delta="${(part as any).delta}", type=${typeof (part as any).delta}`);
            } else if (part.type === 'tool-call') {
              console.log(`[CHAT] Tool call part object keys:`, Object.keys(part));
              console.log(`[CHAT] Tool call part object JSON:`, JSON.stringify(part));
              console.log(`[CHAT] Tool call: name=${part.toolName}, input=`, JSON.stringify((part as any).input));
              if (hasThinkingStarted) {
                safeEnqueue(encoder.encode('</think>'));
                hasThinkingStarted = false;
                isReasoningDeltaActive = false;
              }
              if (part.toolName === 'webSearch') {
                const toolInput = (part as any).input || {};
                const query = typeof toolInput === 'string' ? toolInput : toolInput.query || '';
                if (query) {
                  const escapedQuery = query.replace(/"/g, '&quot;');
                  console.log(`[CHAT] Enqueuing search-loading for query: "${query}"`);
                  safeEnqueue(encoder.encode(`<search-loading query="${escapedQuery}" />`));
                } else {
                  console.warn('[CHAT] Tool call query is empty!', JSON.stringify(toolInput));
                }
              } else if (part.toolName === 'browsePage') {
                const toolInput = (part as any).input || {};
                const url = toolInput.url || '';
                if (url) {
                  const escapedUrl = url.replace(/"/g, '&quot;');
                  console.log(`[CHAT] Enqueuing search-loading for browsePage: "${url}"`);
                  safeEnqueue(encoder.encode(`<search-loading query="Reading ${escapedUrl}" />`));
                }
              } else if (part.toolName === 'mapWebsite') {
                const toolInput = (part as any).input || {};
                const url = toolInput.url || '';
                if (url) {
                  const escapedUrl = url.replace(/"/g, '&quot;');
                  console.log(`[CHAT] Enqueuing search-loading for mapWebsite: "${url}"`);
                  safeEnqueue(encoder.encode(`<search-loading query="Mapping ${escapedUrl}" />`));
                }
              }

            } else if (part.type === 'tool-result') {
              console.log(`[CHAT] Tool result part object JSON:`, JSON.stringify(part));
              console.log(`[CHAT] Tool result: name=${part.toolName}`);
              if (hasThinkingStarted) {
                safeEnqueue(encoder.encode('</think>'));
                hasThinkingStarted = false;
                isReasoningDeltaActive = false;
              }
              if (part.toolName === 'webSearch') {
                const toolResult = (part as any).output || (part as any).result || { query: '', results: [] };
                console.log(`[CHAT] Tool result data results count: ${toolResult.results?.length || 0}`);
                if (toolResult.results && toolResult.results.length > 0) {
                  const resultData = JSON.stringify(toolResult);
                  safeEnqueue(encoder.encode(`<search-results>${resultData}</search-results>`));
                  gotSearchResults = true;
                  lastSearchResultData = toolResult;
                }
              } else if (part.toolName === 'browsePage') {
                const toolResult = (part as any).output || (part as any).result || { url: '', content: '' };
                if (toolResult.url) {
                  const title = extractTitleFromMarkdown(toolResult.content, getFriendlyTitleFromUrl(toolResult.url));
                  const mockResult = {
                    query: toolResult.url,
                    results: [{
                      title: title,
                      url: toolResult.url,
                      content: (toolResult.content || '').substring(0, 1500),
                    }]
                  };
                  const resultData = JSON.stringify(mockResult);
                  safeEnqueue(encoder.encode(`<search-results>${resultData}</search-results>`));
                  gotSearchResults = true;
                  lastSearchResultData = mockResult;
                }
              } else if (part.toolName === 'mapWebsite') {
                const toolResult = (part as any).output || (part as any).result || { url: '', links: [] };
                if (toolResult.url) {
                  let hostname = 'Website';
                  try { hostname = new URL(toolResult.url).hostname.replace('www.', ''); } catch {}
                  
                  const mockResultsList = (toolResult.links || []).map((linkUrl: string) => ({
                    title: getFriendlyTitleFromUrl(linkUrl),
                    url: linkUrl,
                    content: `Discovered subpage of ${new URL(linkUrl).hostname} via website mapping: ${linkUrl}`
                  }));
                  
                  if (mockResultsList.length === 0) {
                    mockResultsList.push({
                      title: `Explored Website - ${hostname}`,
                      url: toolResult.url,
                      content: `No additional subpages discovered.`
                    });
                  }

                  const mockResult = { query: toolResult.url, results: mockResultsList.slice(0, 10) };
                  safeEnqueue(encoder.encode(`<search-results>${JSON.stringify(mockResult)}</search-results>`));
                  gotSearchResults = true;
                  lastSearchResultData = mockResult;
                }
              }

            } else if (part.type === 'raw') {
              let rawData = (part as any).rawValue || (part as any).value || (part as any).chunk;
              if (typeof rawData === 'string') {
                try { rawData = JSON.parse(rawData); } catch {}
              }
              if (rawData && typeof rawData === 'object') {
                const findCitations = (obj: any): string[] | null => {
                  if (!obj || typeof obj !== 'object') return null;
                  if (Array.isArray(obj.citations)) {
                    return obj.citations.every((item: any) => typeof item === 'string') ? obj.citations : null;
                  }
                  for (const key of Object.keys(obj)) {
                    const val = obj[key];
                    if (val && typeof val === 'object') {
                      const found = findCitations(val);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                const citations = findCitations(rawData);
                if (citations) {
                  citations.forEach((url: string) => {
                    if (url && typeof url === 'string') accumulatedCitations.add(url);
                  });
                }
              }
            } else if (part.type === 'error') {
              if (hasThinkingStarted) {
                safeEnqueue(encoder.encode('</think>'));
                hasThinkingStarted = false;
                isReasoningDeltaActive = false;
              }
              console.error('[Stream Error Part]:', part.error);
              const errorMsg = `\n\n⚠️ An error occurred: ${part.error instanceof Error ? part.error.message : String(part.error)}`;
              safeEnqueue(encoder.encode(errorMsg));
            }
          }

          if (hasThinkingStarted) {
            safeEnqueue(encoder.encode('</think>'));
          }

          if (accumulatedCitations.size > 0) {
            const citationsList = Array.from(accumulatedCitations);
            console.log(`[CHAT] Emitting ${citationsList.length} Perplexity citations to client`);
            const mockResults = citationsList.map((url) => {
              let title = 'Source';
              try { title = new URL(url).hostname.replace('www.', ''); } catch {}
              return { title, url, content: `Grounded search source cited by Perplexity.` };
            });
            safeEnqueue(encoder.encode(`<search-results>${JSON.stringify({ query: 'Perplexity Search', results: mockResults })}</search-results>`));
          }

          if (gotSearchResults && !gotTextAfterSearch && lastSearchResultData) {
            console.log('[Safety Net] Model finished after search without text. Making follow-up call...');
            try {
              const searchContext = lastSearchResultData.results
                .map((r: any, i: number) => `[${i + 1}] ${r.title} (${r.url})\n${r.content}`)
                .join('\n\n');

              const followUpMessages = [
                ...formattedMessages,
                { role: 'assistant' as const, content: `I searched the web for "${lastSearchResultData.query}" and found these results:\n\n${searchContext}` },
                { role: 'user' as const, content: 'Now synthesize the search results above into a comprehensive, well-structured answer with inline citations formatted as Markdown links (e.g., [domain.com](url)). Be thorough and informative.' }
              ];

              const followUp = streamText({ model: aiModel, messages: followUpMessages, system: finalSystemPrompt || undefined, maxRetries: 1 });
              for await (const part of followUp.fullStream) {
                if (part.type === 'text-delta') safeEnqueue(encoder.encode(part.text));
              }
            } catch (followUpErr) {
              console.error('[Safety Net] Follow-up call failed:', followUpErr);
              try {
                const fallbackText = `\n\nHere's what I found:\n\n${lastSearchResultData.results
                  .map((r: any) => `- **${r.title}**: ${r.content.substring(0, 200)}... [${new URL(r.url).hostname.replace('www.', '')}](${r.url})`)
                  .join('\n')}`;
                safeEnqueue(encoder.encode(fallbackText));
              } catch {
                safeEnqueue(encoder.encode('\n\nSearch completed but I encountered an error generating a summary.'));
              }
            }
          }

          console.log(`[CHAT] Stream completed. gotSearchResults=${gotSearchResults}, gotTextAfterSearch=${gotTextAfterSearch}`);

        } catch (err) {
          console.error('[Stream Exception]:', err);
          try {
            const errorMessage = err instanceof Error ? err.message : 'Unknown streaming error';
            safeEnqueue(encoder.encode(`\n\n⚠️ Error: ${errorMessage}`));
          } catch {}
        } finally {
          clearInterval(heartbeatInterval);
          isControllerClosed = true;
          try { controller.close(); } catch {}
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'X-No-Compression': 'true',
      },
    });
  } catch (error: any) {
    console.error('[CHAT] Top-level error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}
