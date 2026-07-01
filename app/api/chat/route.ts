export const runtime = 'edge';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, wrapLanguageModel, extractReasoningMiddleware, stepCountIs } from 'ai';
import { createMCPClient } from '@ai-sdk/mcp';
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

function shouldLoadServerTools(server: any, messages: any[]): boolean {
  // Check if any message contains a tool call or result for this server
  const hasPastInteraction = messages.some(m => {
    if (m.toolCalls && Array.isArray(m.toolCalls)) {
      return m.toolCalls.some((tc: any) => 
        tc.function?.name?.toLowerCase().startsWith(server.id.toLowerCase() + '_')
      );
    }
    if (m.role === 'tool') {
      const toolName = m.toolName || (Array.isArray(m.content) && m.content[0]?.toolName);
      if (toolName && toolName.toLowerCase().startsWith(server.id.toLowerCase() + '_')) {
        return true;
      }
    }
    return false;
  });

  if (hasPastInteraction) return true;

  // Scan only the last user message for keyword triggers
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  const promptText = (typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '').toLowerCase();

  const serverId = server.id.toLowerCase();
  const serverName = server.name.toLowerCase();

  // Provider-specific keyword triggers
  if (serverId === 'cal' || serverName.includes('cal')) {
    return promptText.includes('cal') || promptText.includes('calendar') || promptText.includes('meeting') || promptText.includes('schedule') || promptText.includes('booking') || promptText.includes('event');
  }
  if (serverId === 'notion' || serverName.includes('notion')) {
    return promptText.includes('notion') || promptText.includes('page') || promptText.includes('database') || promptText.includes('workspace');
  }
  if (serverId === 'github' || serverName.includes('github')) {
    return promptText.includes('github') || promptText.includes('git') || promptText.includes('repo') || promptText.includes('pr') || promptText.includes('pull') || promptText.includes('issue') || promptText.includes('commit');
  }

  // Generic custom servers: match ID or Name keywords
  return promptText.includes(serverId) || promptText.includes(serverName);
}

function normalizeMessages(messages: any[]): any[] {
  if (!messages || messages.length === 0) return [];
  
  const normalized: any[] = [];
  for (const msg of messages) {
    if (normalized.length === 0) {
      if (msg.role !== 'user') {
        // AI SDKs require the first message to be from the user
        continue;
      }
      normalized.push({ ...msg });
      continue;
    }
    
    const last = normalized[normalized.length - 1];
    if (last.role === msg.role) {
      // Merge consecutive messages of the same role
      if (typeof last.content === 'string' && typeof msg.content === 'string') {
        last.content = (last.content + '\n\n' + msg.content).trim();
      } else {
        const lastParts = Array.isArray(last.content) ? last.content : [{ type: 'text', text: last.content || '' }];
        const newParts = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content || '' }];
        last.content = [...lastParts, ...newParts];
      }
    } else {
      normalized.push({ ...msg });
    }
  }
  
  return normalized;
}

export async function POST(req: Request) {
  try {
    const { messages, model, systemPrompt, mcpServers } = await req.json();
    console.log(`[CHAT] Request: model=${model}, messages=${messages?.length}, search=${req.headers.get('x-search-enabled')}, mcpServers=${mcpServers?.length || 0}`);

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
      const baseModel = (() => {
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
      })();

      // Wrap OpenAI-compatible models with reasoning extraction middleware to cleanly parse thoughts
      if (
        config!.provider === 'nvidia' ||
        config!.provider === 'zenmux' ||
        config!.provider === 'inception' ||
        config!.provider === 'perplexity'
      ) {
        return wrapLanguageModel({
          model: baseModel,
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        });
      }

      return baseModel;
    };

    const providerKeys = { geminiKey, mistralKey, perplexityKey, zenmuxKey, inceptionKey, nvidiaKey };

    let aiModel: any;
    try {
      aiModel = createAIModel(modelConfig, providerKeys);
    } catch (err: any) {
      console.error(`[CHAT] Model creation failed: ${err.message}`);
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }

    const normalizedMessages = normalizeMessages(messages || []);

    const formattedMessages = normalizedMessages.map((msg: any) => {
      if (msg.role === 'tool') {
        return {
          role: 'tool' as const,
          content: msg.content,
        } as any;
      }

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
          role: msg.role === 'user' ? 'user' : (msg.role === 'assistant' ? 'assistant' : msg.role),
          content: parts,
          toolCalls: msg.toolCalls,
        } as any;
      }

      return {
        role: msg.role === 'user' ? 'user' : (msg.role === 'assistant' ? 'assistant' : msg.role),
        content,
        toolCalls: msg.toolCalls,
      } as any;
    });

    console.log('[CHAT formattedMessages]', JSON.stringify(formattedMessages.map((m: any) => ({
      role: m.role,
      contentType: typeof m.content,
      snippet: typeof m.content === 'string' ? m.content.substring(0, 80) : 'parts'
    })), null, 2));

    // Determine if the model can use web search tools
    const hasSearchKeys = !!tavilyKey || !!exaKey || !!firecrawlKey || !!process.env.TAVILY_API_KEY || !!process.env.EXA_API_KEY || !!process.env.FIRECRAWL_API_KEY;
    const canUseTools = modelConfig.provider !== 'perplexity' && hasSearchKeys && searchEnabled;
    console.log(`[CHAT] canUseTools=${canUseTools}, hasSearchKeys=${hasSearchKeys}, searchEnabled=${searchEnabled}, provider=${modelConfig.provider}`);

    const searchKeysObj = {
      tavilyKey: tavilyKey || process.env.TAVILY_API_KEY,
      exaKey: exaKey || process.env.EXA_API_KEY,
      firecrawlKey: firecrawlKey || process.env.FIRECRAWL_API_KEY,
    };

    const searchToolInstance = canUseTools ? createWebSearchTool(searchKeysObj) : null;
    const browseToolInstance = canUseTools ? createBrowsePageTool(searchKeysObj) : null;
    const mapToolInstance = canUseTools ? createMapWebsiteTool(searchKeysObj) : null;

    const tools: Record<string, any> = {};

    if (canUseTools && searchToolInstance) {
      tools.webSearch = searchToolInstance;
      tools.browsePage = browseToolInstance!;
      tools.mapWebsite = mapToolInstance!;
    }

    const successfullyBoundServers: string[] = [];

    if (mcpServers && mcpServers.length > 0) {
      for (const server of mcpServers) {
        if (!server.isEnabled) continue;

        if (server.connectionMode === 'direct') {
          // CLIENT-SIDE DIRECT TOOLS: Omit 'execute' method.
          // Server only provides schemas. LLM tool-calls are streamed to the client.
          for (const tool of server.cachedTools) {
            tools[tool.name] = {
              description: tool.description,
              parameters: {
                type: 'object',
                properties: tool.inputSchema?.properties || {},
                required: tool.inputSchema?.required || [],
                additionalProperties: tool.inputSchema?.additionalProperties
              }
            };
          }
          successfullyBoundServers.push(server.name);
        } else {
          // SERVER-SIDE PROXY TOOLS: Contains 'execute' method.
          // Executed immediately on Next.js server.
          try {
            const transportType = server.url.includes('/sse') ? 'sse' : 'http';
            const mcpClient = await createMCPClient({
              transport: {
                type: transportType as 'sse' | 'http',
                url: server.url,
                headers: server.accessToken ? { 'Authorization': `Bearer ${server.accessToken}` } : undefined
              }
            });

            const serverTools = await mcpClient.tools();
            for (const [name, config] of Object.entries(serverTools)) {
              // Ensure we register under the correct underscore-separated namespaced key matching client expectations
              const resolvedKey = name.replace(/:/g, '_');
              tools[resolvedKey] = {
                ...config,
                execute: async (args: any) => {
                  try {
                    const rawResult = await Promise.race([
                      (config as any).execute(args),
                      new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`Timeout: ${server.name} did not respond.`)), 6000)
                      )
                    ]);

                    // Clean and unwrap the MCP tool result structure
                    if (rawResult && typeof rawResult === 'object' && Array.isArray((rawResult as any).content)) {
                      const textContent = (rawResult as any).content.find((c: any) => c.type === 'text');
                      if (textContent && typeof textContent.text === 'string') {
                        try {
                          return JSON.parse(textContent.text);
                        } catch {
                          return { result: textContent.text };
                        }
                      }
                    }

                    if (typeof rawResult !== 'object' || rawResult === null) {
                      return { result: String(rawResult) };
                    }
                    return rawResult;
                  } catch (err: any) {
                    return { error: err.message };
                  }
                }
              };
            }
            successfullyBoundServers.push(server.name);
          } catch (err) {
            console.error(`[MCP Bind Error] ${server.name}:`, err);
          }
        }
      }
    }

    let finalSystemPrompt = systemPrompt || '';
    const dateInstruction = `Today's date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', weekday: 'short' })}. Use this date to inform temporal reasoning and to construct accurate, current search queries (e.g., when asked about "this year", "recent events", or "latest releases").`;
    finalSystemPrompt = (dateInstruction + '\n' + finalSystemPrompt).trim();

    if (modelConfig.id === 'nvidia/nemotron-nano-12b-v2-vl') {
      const hasVideo = false;
      const mediaSystemPrompt = hasVideo ? '/no_think' : '/think';
      finalSystemPrompt = (mediaSystemPrompt + '\n' + finalSystemPrompt).trim();
    }

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

    if (successfullyBoundServers.length > 0) {
      const namesList = successfullyBoundServers.join(', ');
      const mcpInstruction = `
You currently have the following active MCP App Integrations connected and loaded for this request: ${namesList}.
- You MUST be proactive: if the user asks a question about their schedule, bookings, repositories, pages, or tasks, ALWAYS call the corresponding tools first to fetch information.
- DO NOT lazily refuse or ask the user for specific IDs or UIDs (like event type IDs, repository names, page/database IDs, or booking UIDs) if list/search tools are available.
- Always call listing or searching tools (e.g., listing upcoming bookings, searching files, listing pages) first to discover the relevant items and IDs yourself, and then filter them to answer the user's question.
- If you encounter an error, explain it clearly to the user rather than giving up.
`;
      finalSystemPrompt = (finalSystemPrompt + '\n' + mcpInstruction).trim();
    }

    const toolsConfig = Object.keys(tools).length > 0 ? {
      tools,
      toolChoice: 'auto' as const,
      maxSteps: 5,
      stopWhen: stepCountIs(5),
      onStepFinish: ({ text, toolCalls, toolResults, finishReason }: any) => {
        console.log(`[CHAT Step Finish] reason=${finishReason}, textLength=${text?.length || 0}, toolCalls=${toolCalls?.length || 0}, toolResults=${toolResults?.length || 0}`);
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

      providerOptions.openai = {
        parallelToolCalls: false,
        ...(isReasoningModel && modelConfig.provider === 'zenmux' ? {
          reasoningEffort: 'medium',
          reasoningSummary: 'detailed',
        } : {}),
        ...(Object.keys(extraBody).length > 0 ? { extraBody } : {}),
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
        safeEnqueue(encoder.encode(' '.repeat(4096)));

        // Heartbeat: keeps the mobile/desktop connection alive during tool calls
        // (web search + browsePage can take 5–15s each, enough for browsers/proxies
        // to consider the connection idle and kill it)
        const heartbeatInterval = setInterval(() => {
          safeEnqueue(encoder.encode(': heartbeat\n\n'));
        }, 2000);

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
              
              const isDirectTool = mcpServers?.some((s: any) => 
                s.connectionMode === 'direct' && 
                s.cachedTools?.some((t: any) => t.namespacedName === part.toolName)
              );

              if (isDirectTool) {
                const escapedArgs = JSON.stringify((part as any).input || {}).replace(/"/g, '&quot;');
                console.log(`[CHAT] Enqueuing direct mcp tool call: name="${part.toolName}"`);
                safeEnqueue(encoder.encode(`<mcp-tool-call id="${(part as any).toolCallId}" name="${part.toolName}" args="${escapedArgs}" />`));
              } else if (part.toolName === 'webSearch') {
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
              } else {
                // Any other server-side proxy tool call (Notion, Cal.com, etc.)
                const toolName = part.toolName;
                console.log(`[CHAT] Enqueuing search-loading for proxy tool: "${toolName}"`);
                safeEnqueue(encoder.encode(`<search-loading query="Executing ${toolName}..." />`));
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
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Content-Encoding': 'none',
      },
    });
  } catch (error: any) {
    console.error('[CHAT] Top-level error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}
