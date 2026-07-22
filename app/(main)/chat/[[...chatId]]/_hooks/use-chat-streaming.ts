"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { streamChatContent } from '@/lib/chat-client';
import { executeDirectTool, preflightRefreshIntegrations } from '@/lib/mcp-client';
import { db } from '@/lib/db';
import { updateMessageContentById } from '@/hooks/use-chat-history';
import type { ApiKeys } from '@/hooks/use-api-keys';
import { MODELS_REGISTRY } from '@/lib/models';
import { pruneChatHistory } from '@/utils/chat-context';
import { createDeepResearchArtifactProjector } from '@/lib/artifacts/deep-research-stream';
import { createArtifactStreamProjector } from '@/lib/artifacts/stream-projector';
import { ensureArtifactReferences } from '@/lib/artifacts/reference';
import { ensureReportArtifactTerminalStatus } from '@/lib/artifacts/deep-research';
import { artifactRepository } from '@/lib/artifacts/repository';
import { publishArtifactSnapshot } from '@/lib/artifacts/runtime-store';
import type { ArtifactBundle, UpsertArtifactDraftInput } from '@/lib/artifacts/types';
import type { ChatMessage } from '../_lib/types';

interface UseChatStreamingOptions {
  chatId: string | null;
  apiKeys: ApiKeys;
  searchEnabledRef: MutableRefObject<boolean>;
  researchEnabledRef: MutableRefObject<boolean>;
  selectedMcpIdsRef: MutableRefObject<string[]>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setStreamingMessage: Dispatch<SetStateAction<ChatMessage | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

interface DirectToolCallData {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

function getStoredKey(keys: ApiKeys, name: keyof ApiKeys, storageKey: string) {
  return keys[name] || localStorage.getItem(storageKey);
}

export function useChatStreaming({
  chatId,
  apiKeys,
  searchEnabledRef,
  researchEnabledRef,
  selectedMcpIdsRef,
  setMessages,
  setStreamingMessage,
  setError,
}: UseChatStreamingOptions) {
  const [isLoading, setIsLoading] = useState(() => (
    typeof window !== 'undefined' && chatId
      ? Boolean(sessionStorage.getItem(`pending-stream-${chatId}`))
      : false
  ));
  const isLoadingRef = useRef(isLoading);
  const abortControllerRef = useRef<AbortController | null>(null);
  const apiKeysRef = useRef(apiKeys);

  useEffect(() => {
    apiKeysRef.current = apiKeys;
  }, [apiKeys]);

  const setIsLoadingState = useCallback((value: boolean) => {
    setIsLoading(value);
    isLoadingRef.current = value;
  }, []);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoadingState(false);
  }, [setIsLoadingState]);

  const triggerTitleGeneration = useCallback(async (
    chatId: string,
    firstQuery: string,
    modelMode: string,
  ) => {
    try {
      const keys = apiKeysRef.current;
      const response = await fetch('/api/chat/title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key-gemini': keys.geminiApiKey || localStorage.getItem('gemini-api-key') || '',
          'x-api-key-mistral': keys.mistralApiKey || localStorage.getItem('mistral-api-key') || '',
          'x-api-key-perplexity': keys.perplexityApiKey || localStorage.getItem('perplexity-api-key') || '',
          'x-api-key-zenmux': keys.zenmuxApiKey || localStorage.getItem('zenmux-api-key') || '',
          'x-api-key-inception': keys.inceptionApiKey || localStorage.getItem('inception-api-key') || '',
          'x-api-key-nvidia': keys.nvidiaApiKey || localStorage.getItem('nvidia-api-key') || '',
        },
        body: JSON.stringify({ firstQuery, modelMode }),
      });

      if (response.ok) {
        const { title } = await response.json();
        if (title && title.trim()) {
          const cleanTitle = title.trim().replace(/^["']|["']$/g, '');
          await db.chats.update(chatId, { title: cleanTitle, updatedAt: Date.now() });
        }
      }
    } catch (error) {
      console.error('Failed to auto-generate chat title:', error);
    }
  }, []);

  const runStreaming = useCallback(async (
    chatId: string,
    modelId: string,
    history: ChatMessage[],
    userMsg: ChatMessage,
    assistantMessageId: number,
  ) => {
    await preflightRefreshIntegrations();
    const currentKeys = apiKeysRef.current;
    const keys = {
      geminiApiKey: getStoredKey(currentKeys, 'geminiApiKey', 'gemini-api-key'),
      mistralApiKey: getStoredKey(currentKeys, 'mistralApiKey', 'mistral-api-key'),
      perplexityApiKey: getStoredKey(currentKeys, 'perplexityApiKey', 'perplexity-api-key'),
      zenmuxApiKey: getStoredKey(currentKeys, 'zenmuxApiKey', 'zenmux-api-key'),
      nvidiaApiKey: getStoredKey(currentKeys, 'nvidiaApiKey', 'nvidia-api-key'),
      inceptionApiKey: getStoredKey(currentKeys, 'inceptionApiKey', 'inception-api-key'),
      tavilyApiKey: getStoredKey(currentKeys, 'tavilyApiKey', 'tavily-api-key'),
      exaApiKey: getStoredKey(currentKeys, 'exaApiKey', 'exa-api-key'),
      firecrawlApiKey: getStoredKey(currentKeys, 'firecrawlApiKey', 'firecrawl-api-key'),
    };
    const isSearch = searchEnabledRef.current || localStorage.getItem('search-enabled') === 'true';
    const isResearch = researchEnabledRef.current || localStorage.getItem('research-enabled') === 'true';

    const activeModel = MODELS_REGISTRY.find(model => model.id === modelId) || MODELS_REGISTRY[0];
    const key = activeModel.provider === 'google'
      ? keys.geminiApiKey
      : activeModel.provider === 'mistral'
        ? keys.mistralApiKey
        : activeModel.provider === 'perplexity'
          ? keys.perplexityApiKey
          : activeModel.provider === 'nvidia'
            ? keys.nvidiaApiKey
            : activeModel.provider === 'inception'
              ? keys.inceptionApiKey
              : keys.zenmuxApiKey;

    if (!key) {
      setError(`Please set your API key in the settings to use ${activeModel.name}`);
      setIsLoadingState(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoadingState(true);
    setError(null);

    let accumulatedContent = '';
    let visibilityChangeHandler: (() => void) | null = null;
    let isInternalAbort = false;
    const artifactProjector = isResearch
      ? createDeepResearchArtifactProjector({
          chatId,
          messageId: assistantMessageId,
          fallbackTitle: userMsg.content,
        })
      : null;
    const documentProjector = createArtifactStreamProjector({
      chatId,
      messageId: assistantMessageId,
    });
    const streamedArtifactIds = new Set<string>();
    let artifactPersistenceQueue = Promise.resolve();

    const persistArtifact = (bundle: ArtifactBundle): Promise<void> => {
      const input: UpsertArtifactDraftInput = {
        id: bundle.artifact.id,
        chatId: bundle.artifact.chatId,
        messageId: bundle.artifact.messageId,
        kind: bundle.artifact.kind,
        title: bundle.artifact.title,
        status: bundle.artifact.status,
        markdown: bundle.version.markdown,
        sources: bundle.version.sources,
        now: bundle.artifact.updatedAt,
      };

      artifactPersistenceQueue = artifactPersistenceQueue
        .catch(() => undefined)
        .then(async () => {
          const persisted = await artifactRepository.upsertDraft(input);
          publishArtifactSnapshot(persisted);
        })
        .catch(error => {
          console.warn('[Artifact Save] Failed to checkpoint report:', error);
        });
      return artifactPersistenceQueue;
    };

    const projectArtifact = (
      content: string,
      options?: { force?: boolean; status?: 'streaming' | 'complete' | 'failed' },
    ) => {
      const bundle = artifactProjector?.project(content, options);
      if (bundle) publishArtifactSnapshot(bundle);
      return bundle ?? null;
    };

    try {
      const historyPruned = pruneChatHistory(history, 500, 4);
      const payload = [
        ...historyPruned,
        { role: userMsg.role, content: userMsg.content, images: userMsg.images, pdfs: userMsg.pdfs },
      ];
      const thinkingStartTime = Date.now();
      let thinkingDuration = 0;
      const researchStartTime = Date.now();
      let researchDuration = 0;
      let lastSavedTime = Date.now();
      let flushRafId: number | null = null;
      let flushTimerId: ReturnType<typeof setTimeout> | null = null;
      let pendingFlush = false;

      const doFlush = () => {
        flushRafId = null;
        flushTimerId = null;
        if (!pendingFlush) return;
        pendingFlush = false;
        const content = accumulatedContent;
        setStreamingMessage(previous => {
          if (!previous) return { id: assistantMessageId, role: 'assistant', content };
          if (previous.content === content) return previous;
          return { ...previous, content };
        });
        projectArtifact(content);
      };

      const scheduleFlush = () => {
        if (flushRafId !== null || flushTimerId !== null) return;
        flushRafId = requestAnimationFrame(() => {
          flushRafId = null;
          if (flushTimerId !== null) {
            clearTimeout(flushTimerId);
            flushTimerId = null;
          }
          doFlush();
        });
        flushTimerId = setTimeout(() => {
          flushTimerId = null;
          if (flushRafId !== null) {
            cancelAnimationFrame(flushRafId);
            flushRafId = null;
          }
          doFlush();
        }, 250);
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && pendingFlush) {
          if (flushRafId !== null) {
            cancelAnimationFrame(flushRafId);
            flushRafId = null;
          }
          if (flushTimerId !== null) {
            clearTimeout(flushTimerId);
            flushTimerId = null;
          }
          doFlush();
        }
      };
      visibilityChangeHandler = handleVisibilityChange;
      document.addEventListener('visibilitychange', handleVisibilityChange);

      const activeMcpServers = await db.mcpIntegrations.toArray()
        .catch(() => [])
        .then(list => {
          let selectedIds = selectedMcpIdsRef.current;
          if (selectedIds.length === 0 && chatId) {
            const stored = localStorage.getItem(`paradox_active_mcp_${chatId}`);
            if (stored) {
              try {
                const parsed: unknown = JSON.parse(stored);
                if (Array.isArray(parsed)) selectedIds = parsed;
              } catch (error) {
                console.error('Failed to parse active MCPs inside runStreaming:', error);
              }
            }
          }
          return list.filter(server => (
            server.isEnabled && server.status === 'connected' && selectedIds.includes(server.id)
          ));
        });

      let hasDirectToolCall = false;
      let directToolCallData: DirectToolCallData | null = null;

      const executeStreamLoop = async (payloadToSend: any[]) => {
        accumulatedContent = '';
        hasDirectToolCall = false;
        directToolCallData = null;

        await streamChatContent(
          payloadToSend,
          modelId,
          keys,
          isSearch,
          isResearch,
          token => {
            accumulatedContent += token;
            accumulatedContent = ensureArtifactReferences(
              accumulatedContent,
              streamedArtifactIds,
            );
            const match = accumulatedContent.match(/<mcp-tool-call id="([^"]+)" name="([^"]+)" args="([^"]+)"\s*\/>/);
            if (match) {
              hasDirectToolCall = true;
              directToolCallData = {
                id: match[1],
                name: match[2],
                args: JSON.parse(match[3].replace(/&quot;/g, '"')),
              };
              isInternalAbort = true;
              controller.abort();
            }
            if (accumulatedContent.includes('</think>') && thinkingDuration === 0) {
              thinkingDuration = (Date.now() - thinkingStartTime) / 1000;
            }
            pendingFlush = true;
            scheduleFlush();
            const now = Date.now();
            if (now - lastSavedTime > 1500) {
              lastSavedTime = now;
              const cleanContent = accumulatedContent.replace(/<mcp-tool-call[\s\S]*?\/>/g, '');
              updateMessageContentById(assistantMessageId, cleanContent).catch(error => {
                console.warn('[IndexedDB Save] Failed to update intermediate content:', error);
              });
              const artifact = projectArtifact(cleanContent, { force: true });
              if (artifact) void persistArtifact(artifact);
            }
          },
          activeMcpServers,
          controller.signal,
          event => {
            documentProjector.handle(event);
            if (event.type !== 'start') return;

            streamedArtifactIds.add(event.artifactId);
            accumulatedContent = ensureArtifactReferences(
              accumulatedContent,
              streamedArtifactIds,
            );
            pendingFlush = true;
            scheduleFlush();
          },
        ).catch(error => {
          if (hasDirectToolCall) return;
          throw error;
        });

        if (hasDirectToolCall && directToolCallData) {
          const callData = directToolCallData as DirectToolCallData;
          const targetServer = activeMcpServers.find(server => (
            server.connectionMode === 'direct' &&
            server.cachedTools?.some(tool => tool.namespacedName === callData.name)
          ));
          if (!targetServer) {
            throw new Error(`Direct tool handler for ${callData.name} not found.`);
          }
          const toolMeta = targetServer.cachedTools.find(tool => tool.namespacedName === callData.name);
          const originalToolName = toolMeta ? toolMeta.name : callData.name;
          accumulatedContent = accumulatedContent.replace(/<mcp-tool-call[\s\S]*?\/>/g, '');
          doFlush();

          let toolResult: any = null;
          try {
            toolResult = await executeDirectTool(
              targetServer.url,
              originalToolName,
              callData.args,
              targetServer.accessToken,
            );
          } catch (error: any) {
            toolResult = { error: error.message || 'Direct browser tool execution failed.' };
          }
          let cleanResult = toolResult;
          if (toolResult && typeof toolResult === 'object' && Array.isArray(toolResult.content)) {
            const textContent = toolResult.content.find((content: any) => content.type === 'text');
            if (textContent && typeof textContent.text === 'string') {
              try {
                cleanResult = JSON.parse(textContent.text);
              } catch {
                cleanResult = textContent.text;
              }
            }
          }

          const assistantToolMessage = {
            role: 'assistant',
            content: '',
            toolCalls: [{
              id: callData.id,
              type: 'function' as const,
              function: { name: callData.name, arguments: JSON.stringify(callData.args) },
            }],
          };
          const toolResultMessage = {
            role: 'tool',
            content: [{
              type: 'tool-result',
              toolCallId: callData.id,
              toolName: callData.name,
              result: cleanResult,
            }],
          };
          isInternalAbort = false;
          const nextController = new AbortController();
          abortControllerRef.current = nextController;
          await executeStreamLoop([...payloadToSend, assistantToolMessage, toolResultMessage]);
        }
      };

      await executeStreamLoop(payload);
      await documentProjector.settle();
      if (visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler);
        visibilityChangeHandler = null;
      }
      if (flushRafId !== null) cancelAnimationFrame(flushRafId);
      if (flushTimerId !== null) clearTimeout(flushTimerId);

      let finalContent = ensureArtifactReferences(accumulatedContent, streamedArtifactIds);
      if (thinkingDuration > 0 && finalContent.includes('</think>')) {
        finalContent = finalContent.replace(
          '</think>',
          `</think><thinkingTime>${thinkingDuration.toFixed(1)}</thinkingTime>`,
        );
      }
      if (isResearch) {
        researchDuration = (Date.now() - researchStartTime) / 1000;
        finalContent += `<researchTime>${researchDuration.toFixed(1)}</researchTime>`;
      }
      const finalArtifact = projectArtifact(finalContent, { force: true });
      if (finalArtifact) await persistArtifact(finalArtifact);
      await updateMessageContentById(assistantMessageId, finalContent);
      await db.chats.update(chatId, { updatedAt: Date.now() });
      setMessages(previous => [...previous, {
        id: assistantMessageId,
        role: 'assistant',
        content: finalContent,
      }]);
      setStreamingMessage(null);
      if (history.length === 0) {
        void triggerTitleGeneration(chatId, userMsg.content, modelId);
      }
    } catch (error: any) {
      const isAbort = error?.name === 'AbortError'
        || error?.message === 'Aborted'
        || String(error?.message || '').toLowerCase().includes('abort');
      if (isAbort) {
        if (isInternalAbort) return;
        await documentProjector.settle('failed');
        const stoppedContent = ensureArtifactReferences(
          ensureReportArtifactTerminalStatus(accumulatedContent, 'failed'),
          streamedArtifactIds,
        );
        const stoppedArtifact = projectArtifact(stoppedContent, {
          force: true,
          status: 'failed',
        });
        if (stoppedArtifact) {
          await persistArtifact(stoppedArtifact);
          await updateMessageContentById(assistantMessageId, stoppedContent);
          setMessages(previous => [...previous, {
            id: assistantMessageId,
            role: 'assistant',
            content: stoppedContent,
          }]);
          setStreamingMessage(null);
        }
        console.log('Stream stopped by user');
        return;
      }
      console.error('Error generating response:', error);
      await documentProjector.settle('failed');
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to generate response. Please try again.';
      setError(errorMessage);
      accumulatedContent = ensureArtifactReferences(
        ensureReportArtifactTerminalStatus(accumulatedContent, 'failed'),
        streamedArtifactIds,
      );
      const failedArtifact = projectArtifact(accumulatedContent, {
        force: true,
        status: 'failed',
      });
      if (failedArtifact) await persistArtifact(failedArtifact);
      if (accumulatedContent.trim()) {
        accumulatedContent += `\n\n⚠️ Connection Error: ${errorMessage}`;
        setMessages(previous => [...previous, {
          id: assistantMessageId,
          role: 'assistant',
          content: accumulatedContent,
        }]);
        setStreamingMessage(null);
        await updateMessageContentById(assistantMessageId, accumulatedContent);
        await db.chats.update(chatId, { updatedAt: Date.now() });
      } else {
        setStreamingMessage(null);
        await db.messages.delete(assistantMessageId);
      }
    } finally {
      setIsLoadingState(false);
      if (visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler);
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [researchEnabledRef, searchEnabledRef, selectedMcpIdsRef, setError, setMessages, setStreamingMessage, setIsLoadingState, triggerTitleGeneration]);

  return {
    isLoading,
    isLoadingRef,
    setIsLoadingState,
    handleStop,
    runStreaming,
    triggerTitleGeneration,
  };
}
