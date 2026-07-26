import { streamText } from 'ai';
import type { MCPIntegration } from '@/lib/db';
import { createArtifactId } from '@/lib/artifacts/identity';
import { serializeArtifactReference } from '@/lib/artifacts/reference';
import type { ArtifactStreamEvent } from '@/lib/artifacts/stream';
import {
  ARTIFACT_TOOL_NAME,
  artifactRequestSchema,
  type ArtifactRequest,
} from '@/lib/artifacts/tool';
import {
  CHAT_STREAM_PROTOCOL,
  encodeChatStreamComment,
  encodeChatStreamContent,
  encodeChatStreamArtifact,
} from '@/lib/streaming/chat-stream-protocol';
import { SearchTaskStreamTracker } from '@/lib/streaming/search-task-stream';
import {
  normalizeExternalSourceUrl,
  normalizeSourceCollection,
} from '@/lib/research/source-normalization';
import { extractTitleFromMarkdown, getFriendlyTitleFromUrl } from './source-utils';
import type { SearchResultData } from './types';
import { streamArtifactDocument } from './artifact-writer';

interface CreateChatStreamResponseOptions {
  result: any;
  aiModel: any;
  formattedMessages: any[];
  finalSystemPrompt: string;
  mcpServers?: MCPIntegration[];
  providerOptions?: any;
}

interface QueuedArtifact {
  artifactId: string;
  request: ArtifactRequest;
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
  providerOptions,
}: CreateChatStreamResponseOptions): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let isControllerClosed = false;
      const safeEnqueue = (data: string) => {
        if (!isControllerClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            isControllerClosed = true;
          }
        }
      };
      const emit = (content: string) => safeEnqueue(encodeChatStreamContent(content));
      const emitArtifact = (artifact: ArtifactStreamEvent) =>
        safeEnqueue(encodeChatStreamArtifact(artifact));
      const emitComment = (label: string, paddingLength = 0) =>
        safeEnqueue(encodeChatStreamComment(label, paddingLength));

      // Force immediate header flush to prevent proxy and middleware buffering.
      emitComment('padding', 4096);

      // Keep the connection alive during long-running search and MCP calls.
      const heartbeatInterval = setInterval(() => {
        emitComment('heartbeat');
      }, 2000);

      let hasThinkingStarted = false;
      let isReasoningDeltaActive = false;
      let gotSearchResults = false;
      let gotTextAfterSearch = false;
      let lastSearchResultData: SearchResultData | null = null;
      let repetitionBuffer = '';
      let repetitionCount = 0;
      const accumulatedCitations = new Set<string>();
      const queuedArtifacts: QueuedArtifact[] = [];
      const searchTaskStream = new SearchTaskStreamTracker();
      const emitSearchTaskStart = (label: string, toolCallId?: string, fallbackKey?: string) => {
        const marker = searchTaskStream.start({ label, toolCallId, fallbackKey });
        if (marker) emit(marker);
      };

      try {
        for await (const part of result.fullStream) {
          console.log(`[CHAT] Part type: ${part.type}`);
          if (part.type === 'reasoning-delta') {
            console.log(`[CHAT reasoning-delta] text: "${part.text}"`);
            if (!hasThinkingStarted) {
              emit('<think>');
              hasThinkingStarted = true;
              isReasoningDeltaActive = true;
            }
            emit(part.text);
          } else if (part.type === 'text-delta') {
            console.log(`[CHAT text-delta] text: "${part.text}"`);
            if (hasThinkingStarted && isReasoningDeltaActive) {
              emit('</think>');
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

            emit(text);
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
              emit('</think>');
              hasThinkingStarted = false;
              isReasoningDeltaActive = false;
            }

            if (part.toolName === ARTIFACT_TOOL_NAME) {
              const parsedRequest = artifactRequestSchema.safeParse((part as any).input);
              if (parsedRequest.success && queuedArtifacts.length === 0) {
                const artifactId = createArtifactId();
                queuedArtifacts.push({ artifactId, request: parsedRequest.data });
                emitArtifact({
                  type: 'start',
                  artifactId,
                  kind: 'markdown-document',
                  title: parsedRequest.data.title,
                });
                emit(serializeArtifactReference(artifactId));
              } else if (parsedRequest.success) {
                console.warn(
                  '[Artifact] Ignoring an additional createArtifactDocument call in the same assistant turn.',
                );
              }
              continue;
            }

            const isDirectTool = mcpServers?.some(
              (server) =>
                server.connectionMode === 'direct' &&
                server.cachedTools?.some((tool) => tool.namespacedName === part.toolName),
            );

            if (isDirectTool) {
              const escapedArgs = JSON.stringify((part as any).input || {}).replace(/"/g, '&quot;');
              console.log(`[CHAT] Enqueuing direct mcp tool call: name="${part.toolName}"`);
              emit(
                `<mcp-tool-call id="${(part as any).toolCallId}" name="${part.toolName}" args="${escapedArgs}" />`,
              );
            } else if (part.toolName === 'webSearch') {
              const toolInput = (part as any).input || {};
              const query = typeof toolInput === 'string' ? toolInput : toolInput.query || '';
              if (query) {
                console.log(`[CHAT] Enqueuing search-loading for query: "${query}"`);
                emitSearchTaskStart(query, (part as any).toolCallId);
              } else {
                console.warn('[CHAT] Tool call query is empty!', JSON.stringify(toolInput));
              }
            } else if (part.toolName === 'browsePage') {
              const toolInput = (part as any).input || {};
              const url = toolInput.url || '';
              if (url) {
                console.log(`[CHAT] Enqueuing search-loading for browsePage: "${url}"`);
                emitSearchTaskStart(`Reading ${url}`, (part as any).toolCallId);
              }
            } else if (part.toolName === 'mapWebsite') {
              const toolInput = (part as any).input || {};
              const url = toolInput.url || '';
              if (url) {
                console.log(`[CHAT] Enqueuing search-loading for mapWebsite: "${url}"`);
                emitSearchTaskStart(`Mapping ${url}`, (part as any).toolCallId);
              }
            } else {
              const toolName = part.toolName;
              console.log(`[CHAT] Enqueuing search-loading for proxy tool: "${toolName}"`);
              emitSearchTaskStart(`Executing ${toolName}...`, (part as any).toolCallId);
            }
          } else if (part.type === 'tool-result') {
            console.log('[CHAT] Tool result part object JSON:', JSON.stringify(part));
            console.log(`[CHAT] Tool result: name=${part.toolName}`);
            if (hasThinkingStarted) {
              emit('</think>');
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
                emitSearchTaskStart(
                  typeof toolResult.query === 'string' && toolResult.query.trim()
                    ? toolResult.query
                    : 'Search the web',
                  (part as any).toolCallId,
                );
                emit(`<search-results>${JSON.stringify(normalizedToolResult)}</search-results>`);
                gotSearchResults = true;
                lastSearchResultData = normalizedToolResult;
              }
            } else if (part.toolName === 'browsePage') {
              const toolResult =
                (part as any).output || (part as any).result || { url: '', content: '' };
              if (toolResult.url) {
                emitSearchTaskStart(`Reading ${toolResult.url}`, (part as any).toolCallId);
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
                emit(`<search-results>${JSON.stringify(searchResult)}</search-results>`);
                gotSearchResults = true;
                lastSearchResultData = searchResult;
              }
            } else if (part.toolName === 'mapWebsite') {
              const toolResult =
                (part as any).output || (part as any).result || { url: '', links: [] };
              if (toolResult.url) {
                emitSearchTaskStart(`Mapping ${toolResult.url}`, (part as any).toolCallId);
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
                emit(`<search-results>${JSON.stringify(searchResult)}</search-results>`);
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
              emit('</think>');
              hasThinkingStarted = false;
              isReasoningDeltaActive = false;
            }
            console.error('[Stream Error Part]:', part.error);
            const errorMessage = `\n\n⚠️ An error occurred: ${
              part.error instanceof Error ? part.error.message : String(part.error)
            }`;
            emit(errorMessage);
          }
        }

        if (hasThinkingStarted) {
          emit('</think>');
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
          emitSearchTaskStart('Perplexity Search', undefined, 'provider-native-search');
          emit(
            `<search-results>${JSON.stringify({
              query: 'Perplexity Search',
              results: mockResults,
            })}</search-results>`,
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
              if (part.type === 'text-delta') emit(part.text);
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
              emit(fallbackText);
            } catch {
              emit('\n\nSearch completed but I encountered an error generating a summary.');
            }
          }
        }

        for (const queuedArtifact of queuedArtifacts) {
          try {
            await streamArtifactDocument({
              model: aiModel,
              messages: formattedMessages,
              request: queuedArtifact.request,
              providerOptions,
              onDelta: (delta) => emitArtifact({
                type: 'delta',
                artifactId: queuedArtifact.artifactId,
                delta,
              }),
            });
            emitArtifact({
              type: 'complete',
              artifactId: queuedArtifact.artifactId,
            });
          } catch (artifactError) {
            console.error('[Artifact Writer Error]:', artifactError);
            emitArtifact({
              type: 'error',
              artifactId: queuedArtifact.artifactId,
              message: artifactError instanceof Error
                ? artifactError.message
                : 'The artifact could not be completed.',
            });
          }
        }

        console.log(
          `[CHAT] Stream completed. gotSearchResults=${gotSearchResults}, gotTextAfterSearch=${gotTextAfterSearch}`,
        );
      } catch (error) {
        console.error('[Stream Exception]:', error);
        try {
          const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
          emit(`\n\n⚠️ Error: ${errorMessage}`);
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
      'X-Paradox-Stream-Protocol': CHAT_STREAM_PROTOCOL,
    },
  });
}
