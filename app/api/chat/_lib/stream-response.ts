import { streamText } from 'ai';
import type { MCPIntegration } from '@/lib/db';
import {
  normalizeExternalSourceUrl,
  normalizeSourceCollection,
} from '@/lib/research/source-normalization';
import { extractTitleFromMarkdown, getFriendlyTitleFromUrl } from './source-utils';
import type { SearchResultData } from './types';

interface CreateChatStreamResponseOptions {
  result: any;
  aiModel: any;
  formattedMessages: any[];
  finalSystemPrompt: string;
  mcpServers?: MCPIntegration[];
}

function findCitations(value: any): string[] | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value.citations)) {
    return value.citations.every((item: any) => typeof item === 'string')
      ? value.citations
      : null;
  }
  for (const key of Object.keys(value)) {
    const child = value[key];
    if (child && typeof child === 'object') {
      const found = findCitations(child);
      if (found) return found;
    }
  }
  return null;
}

export function createChatStreamResponse({
  result,
  aiModel,
  formattedMessages,
  finalSystemPrompt,
  mcpServers,
}: CreateChatStreamResponseOptions): Response {
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

      // Force immediate header flush to prevent proxy and middleware buffering.
      safeEnqueue(encoder.encode(' '.repeat(4096)));

      // Keep the connection alive during long-running search and MCP calls.
      const heartbeatInterval = setInterval(() => {
        safeEnqueue(encoder.encode(': heartbeat\n\n'));
      }, 2000);

      let hasThinkingStarted = false;
      let isReasoningDeltaActive = false;
      let gotSearchResults = false;
      let gotTextAfterSearch = false;
      let lastSearchResultData: SearchResultData | null = null;
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
            console.log(
              `[CHAT] Tool input delta: delta="${(part as any).delta}", type=${typeof (part as any).delta}`,
            );
          } else if (part.type === 'tool-call') {
            console.log('[CHAT] Tool call part object keys:', Object.keys(part));
            console.log('[CHAT] Tool call part object JSON:', JSON.stringify(part));
            console.log(
              `[CHAT] Tool call: name=${part.toolName}, input=`,
              JSON.stringify((part as any).input),
            );
            if (hasThinkingStarted) {
              safeEnqueue(encoder.encode('</think>'));
              hasThinkingStarted = false;
              isReasoningDeltaActive = false;
            }

            const isDirectTool = mcpServers?.some(
              (server) =>
                server.connectionMode === 'direct' &&
                server.cachedTools?.some((tool) => tool.namespacedName === part.toolName),
            );

            if (isDirectTool) {
              const escapedArgs = JSON.stringify((part as any).input || {}).replace(/"/g, '&quot;');
              console.log(`[CHAT] Enqueuing direct mcp tool call: name="${part.toolName}"`);
              safeEnqueue(
                encoder.encode(
                  `<mcp-tool-call id="${(part as any).toolCallId}" name="${part.toolName}" args="${escapedArgs}" />`,
                ),
              );
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
              const toolName = part.toolName;
              console.log(`[CHAT] Enqueuing search-loading for proxy tool: "${toolName}"`);
              safeEnqueue(encoder.encode(`<search-loading query="Executing ${toolName}..." />`));
            }
          } else if (part.type === 'tool-result') {
            console.log('[CHAT] Tool result part object JSON:', JSON.stringify(part));
            console.log(`[CHAT] Tool result: name=${part.toolName}`);
            if (hasThinkingStarted) {
              safeEnqueue(encoder.encode('</think>'));
              hasThinkingStarted = false;
              isReasoningDeltaActive = false;
            }

            if (part.toolName === 'webSearch') {
              const toolResult =
                (part as any).output || (part as any).result || { query: '', results: [] };
              const normalizedResults = normalizeSourceCollection(
                Array.isArray(toolResult.results) ? toolResult.results : [],
              );
              console.log(
                `[CHAT] Tool result data results count: ${normalizedResults.length}`,
              );
              if (normalizedResults.length > 0) {
                const normalizedToolResult = { ...toolResult, results: normalizedResults };
                safeEnqueue(
                  encoder.encode(`<search-results>${JSON.stringify(normalizedToolResult)}</search-results>`),
                );
                gotSearchResults = true;
                lastSearchResultData = normalizedToolResult;
              }
            } else if (part.toolName === 'browsePage') {
              const toolResult =
                (part as any).output || (part as any).result || { url: '', content: '' };
              if (toolResult.url) {
                const title = extractTitleFromMarkdown(
                  toolResult.content,
                  getFriendlyTitleFromUrl(toolResult.url),
                );
                const searchResult: SearchResultData = {
                  query: toolResult.url,
                  results: [
                    {
                      title,
                      url: toolResult.url,
                      content: (toolResult.content || '').substring(0, 1500),
                    },
                  ],
                };
                safeEnqueue(
                  encoder.encode(`<search-results>${JSON.stringify(searchResult)}</search-results>`),
                );
                gotSearchResults = true;
                lastSearchResultData = searchResult;
              }
            } else if (part.toolName === 'mapWebsite') {
              const toolResult =
                (part as any).output || (part as any).result || { url: '', links: [] };
              if (toolResult.url) {
                let hostname = 'Website';
                try {
                  hostname = new URL(toolResult.url).hostname.replace('www.', '');
                } catch {}

                const mockResultsList = (toolResult.links || []).map((linkUrl: string) => ({
                  title: getFriendlyTitleFromUrl(linkUrl),
                  url: linkUrl,
                  content: `Discovered subpage of ${new URL(linkUrl).hostname} via website mapping: ${linkUrl}`,
                }));

                if (mockResultsList.length === 0) {
                  mockResultsList.push({
                    title: `Explored Website - ${hostname}`,
                    url: toolResult.url,
                    content: 'No additional subpages discovered.',
                  });
                }

                const searchResult: SearchResultData = {
                  query: toolResult.url,
                  results: mockResultsList.slice(0, 10),
                };
                safeEnqueue(
                  encoder.encode(`<search-results>${JSON.stringify(searchResult)}</search-results>`),
                );
                gotSearchResults = true;
                lastSearchResultData = searchResult;
              }
            }
          } else if (part.type === 'raw') {
            let rawData = (part as any).rawValue || (part as any).value || (part as any).chunk;
            if (typeof rawData === 'string') {
              try {
                rawData = JSON.parse(rawData);
              } catch {}
            }
            if (rawData && typeof rawData === 'object') {
              const citations = findCitations(rawData);
              citations?.forEach((url) => {
                const normalizedUrl = normalizeExternalSourceUrl(url);
                if (normalizedUrl) accumulatedCitations.add(normalizedUrl);
              });
            }
          } else if (part.type === 'error') {
            if (hasThinkingStarted) {
              safeEnqueue(encoder.encode('</think>'));
              hasThinkingStarted = false;
              isReasoningDeltaActive = false;
            }
            console.error('[Stream Error Part]:', part.error);
            const errorMessage = `\n\n⚠️ An error occurred: ${
              part.error instanceof Error ? part.error.message : String(part.error)
            }`;
            safeEnqueue(encoder.encode(errorMessage));
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
            try {
              title = new URL(url).hostname.replace('www.', '');
            } catch {}
            return {
              title,
              url,
              content: 'Grounded search source cited by Perplexity.',
            };
          });
          safeEnqueue(
            encoder.encode(
              `<search-results>${JSON.stringify({
                query: 'Perplexity Search',
                results: mockResults,
              })}</search-results>`,
            ),
          );
        }

        if (gotSearchResults && !gotTextAfterSearch && lastSearchResultData) {
          console.log('[Safety Net] Model finished after search without text. Making follow-up call...');
          try {
            const searchContext = lastSearchResultData.results
              .map(
                (searchResult, index) =>
                  `[${index + 1}] ${searchResult.title} (${searchResult.url})\n${searchResult.content}`,
              )
              .join('\n\n');

            const followUpMessages = [
              ...formattedMessages,
              {
                role: 'assistant' as const,
                content: `I searched the web for "${lastSearchResultData.query}" and found these results:\n\n${searchContext}`,
              },
              {
                role: 'user' as const,
                content:
                  'Now synthesize the search results above into a comprehensive, well-structured answer with inline citations formatted as Markdown links (e.g., [domain.com](url)). Be thorough and informative.',
              },
            ];

            const followUp = streamText({
              model: aiModel,
              messages: followUpMessages,
              system: finalSystemPrompt || undefined,
              maxRetries: 1,
            });
            for await (const part of followUp.fullStream) {
              if (part.type === 'text-delta') safeEnqueue(encoder.encode(part.text));
            }
          } catch (followUpError) {
            console.error('[Safety Net] Follow-up call failed:', followUpError);
            try {
              const fallbackText = `\n\nHere's what I found:\n\n${lastSearchResultData.results
                .map(
                  (searchResult) =>
                    `- **${searchResult.title}**: ${searchResult.content.substring(0, 200)}... [${new URL(searchResult.url).hostname.replace('www.', '')}](${searchResult.url})`,
                )
                .join('\n')}`;
              safeEnqueue(encoder.encode(fallbackText));
            } catch {
              safeEnqueue(
                encoder.encode(
                  '\n\nSearch completed but I encountered an error generating a summary.',
                ),
              );
            }
          }
        }

        console.log(
          `[CHAT] Stream completed. gotSearchResults=${gotSearchResults}, gotTextAfterSearch=${gotTextAfterSearch}`,
        );
      } catch (error) {
        console.error('[Stream Exception]:', error);
        try {
          const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
          safeEnqueue(encoder.encode(`\n\n⚠️ Error: ${errorMessage}`));
        } catch {}
      } finally {
        clearInterval(heartbeatInterval);
        isControllerClosed = true;
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
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none',
    },
  });
}
