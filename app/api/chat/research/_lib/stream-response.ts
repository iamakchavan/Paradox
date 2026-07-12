import type { SearchKeys } from '@/lib/research/client';
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
}

export function createResearchStreamResponse({
  formattedMessages,
  aiModel,
  systemPrompt,
  searchKeys,
  plannerProviderOptions,
  synthesisProviderOptions,
}: CreateResearchStreamResponseOptions): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let isControllerClosed = false;
      const safeEnqueue = (data: Uint8Array) => {
        if (!isControllerClosed) {
          try {
            controller.enqueue(data);
          } catch (error) {
            console.warn('[Research Stream] Failed to enqueue (controller likely closed):', error);
            isControllerClosed = true;
          }
        }
      };
      const emit = (content: string) => safeEnqueue(encoder.encode(content));

      // Force immediate header flush to prevent serverless and proxy buffering.
      emit(' '.repeat(2048));

      const heartbeatInterval = setInterval(() => {
        try {
          emit(': heartbeat\n\n');
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
        });
        const executionResult = await executeResearchPlan({
          planResult,
          searchKeys,
          emit,
        });
        await synthesizeResearch({
          planResult,
          executionResult,
          formattedMessages,
          aiModel,
          systemPrompt,
          providerOptions: synthesisProviderOptions,
          emit,
        });
      } catch (error) {
        console.error('[Deep Research Stream Exception]:', error);
        try {
          const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
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
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none',
    },
  });
}

