import type { SearchKeys } from '@/lib/research/client';
import { isAbortError } from '@/lib/research/request-policy';
import {
  CHAT_STREAM_PROTOCOL,
  encodeChatStreamComment,
  encodeChatStreamContent,
} from '@/lib/streaming/chat-stream-protocol';
import { executeResearchPlan } from './executor';
import { planResearch } from './planner';
import { synthesizeResearch } from './synthesis';

interface CreateResearchStreamResponseOptions {
  formattedMessages: any[];
  aiModel: any;
  systemPrompt?: string;
  searchKeys: SearchKeys;
  plannerProviderOptions: Record<string, any>;
  synthesisProviderOptions: Record<string, any>;
  signal?: AbortSignal;
}

export function createResearchStreamResponse({
  formattedMessages,
  aiModel,
  systemPrompt,
  searchKeys,
  plannerProviderOptions,
  synthesisProviderOptions,
  signal,
}: CreateResearchStreamResponseOptions): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let isControllerClosed = false;
      const closeForAbort = () => {
        if (isControllerClosed) return;
        isControllerClosed = true;
        try {
          controller.close();
        } catch {}
      };
      signal?.addEventListener('abort', closeForAbort, { once: true });

      const safeEnqueue = (data: string) => {
        if (!isControllerClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.warn('[Research Stream] Failed to enqueue (controller likely closed):', error);
            isControllerClosed = true;
          }
        }
      };
      const emit = (content: string) => safeEnqueue(encodeChatStreamContent(content));
      const emitComment = (label: string, paddingLength = 0) =>
        safeEnqueue(encodeChatStreamComment(label, paddingLength));

      // Force immediate header flush to prevent serverless and proxy buffering.
      emitComment('padding', 2048);

      const heartbeatInterval = setInterval(() => {
        try {
          emitComment('heartbeat');
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 2000);

      try {
        const planResult = await planResearch({
          formattedMessages,
          aiModel,
          providerOptions: plannerProviderOptions,
          emit,
          signal,
        });
        const executionResult = await executeResearchPlan({
          planResult,
          searchKeys,
          emit,
          signal,
        });
        await synthesizeResearch({
          planResult,
          executionResult,
          formattedMessages,
          aiModel,
          systemPrompt,
          providerOptions: synthesisProviderOptions,
          emit,
          signal,
        });
      } catch (error) {
        if (isAbortError(error) || signal?.aborted) {
          console.info('[Deep Research] Request cancelled.');
          return;
        }
        console.error('[Deep Research Stream Exception]:', error);
        try {
          const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
          emit(`\n\n⚠️ Error: ${errorMessage}`);
        } catch {}
      } finally {
        clearInterval(heartbeatInterval);
        signal?.removeEventListener('abort', closeForAbort);
        try {
          if (!isControllerClosed) controller.close();
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

