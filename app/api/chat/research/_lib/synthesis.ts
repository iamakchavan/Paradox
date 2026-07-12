import { streamText } from 'ai';
import {
  buildConversationalSystemPrompt,
  buildSynthesisSystemPrompt,
} from './prompts';
import type {
  ResearchExecutionResult,
  ResearchPlanResult,
  ResearchStreamEmitter,
} from './types';

interface SynthesizeResearchOptions {
  planResult: ResearchPlanResult;
  executionResult: ResearchExecutionResult;
  formattedMessages: any[];
  aiModel: any;
  systemPrompt?: string;
  providerOptions: Record<string, any>;
  emit: ResearchStreamEmitter;
}

function buildResearchContext(executionResult: ResearchExecutionResult): string {
  let researchContext = '';
  if (executionResult.searchResults.length > 0) {
    researchContext += '### Search Snippets Context:\n\n';
    executionResult.searchResults.forEach((searchResult, index) => {
      researchContext += `Query "${searchResult.query}":\n`;
      searchResult.results.forEach((result, resultIndex) => {
        researchContext += `[Source ${index + 1}-${resultIndex + 1}] Title: ${result.title} (URL: ${result.url})\nSnippet: ${result.content}\n\n`;
      });
    });
  }

  if (executionResult.scrapedDocuments.length > 0) {
    researchContext += '### Scraped Full-Page Contents:\n\n';
    executionResult.scrapedDocuments.forEach((document, index) => {
      researchContext += `[Scraped Document ${index + 1}] Title: ${document.title} (URL: ${document.url})\nContent:\n${document.content.substring(0, 4000)}\n\n`;
    });
  }
  return researchContext;
}

function createCompletion({
  planResult,
  executionResult,
  formattedMessages,
  aiModel,
  systemPrompt,
  providerOptions,
  emit,
}: SynthesizeResearchOptions): any {
  if (planResult.researchNeeded) {
    emit('<research-step type="synthesis" status="started" />');
    const synthesisMessages = [
      ...formattedMessages,
      {
        role: 'assistant' as const,
        content:
          'I have completed the deep research phase. Synthesizing the gathered information into a detailed final report...',
      },
      {
        role: 'user' as const,
        content:
          'Please synthesize the collected research context into a comprehensive, professional report answering my prompt. Use natural formatting and strictly adhere to the inline citation rules.',
      },
    ];

    console.log('[DEEP RESEARCH SYNTHESIS] Starting streamText for synthesis...');
    return streamText({
      model: aiModel,
      messages: synthesisMessages,
      system: buildSynthesisSystemPrompt(buildResearchContext(executionResult), systemPrompt),
      maxRetries: 2,
      providerOptions,
    });
  }

  console.log('[DEEP RESEARCH] No research needed, streaming standard conversational reply...');
  return streamText({
    model: aiModel,
    messages: formattedMessages,
    system: buildConversationalSystemPrompt(systemPrompt),
    maxRetries: 2,
    providerOptions,
  });
}

export async function synthesizeResearch(options: SynthesizeResearchOptions): Promise<void> {
  const result = createCompletion(options);
  const { emit, planResult } = options;
  let hasThinkingStarted = false;
  let isReasoningDeltaActive = false;
  let repetitionBuffer = '';
  let repetitionCount = 0;

  console.log('[DEEP RESEARCH SYNTHESIS] Iterating fullStream...');
  for await (const part of result.fullStream) {
    console.log(`[DEEP RESEARCH SYNTHESIS STREAM] Part type: ${part.type}`);
    if (part.type === 'reasoning-delta') {
      console.log(`[DEEP RESEARCH reasoning-delta] text: "${part.text}"`);
      if (!hasThinkingStarted) {
        emit('<think>');
        hasThinkingStarted = true;
        isReasoningDeltaActive = true;
      }
      emit(part.text);
    } else if (part.type === 'text-delta') {
      console.log(`[DEEP RESEARCH text-delta] text: "${part.text}"`);
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
    } else if (part.type === 'error') {
      if (hasThinkingStarted) {
        emit('</think>');
      }
      console.error('[DEEP RESEARCH SYNTHESIS STREAM ERROR]:', part.error);
      emit(
        `\n\n⚠️ Error: ${part.error instanceof Error ? part.error.message : String(part.error)}`,
      );
    }
  }

  if (hasThinkingStarted) {
    emit('</think>');
  }
  if (planResult.researchNeeded) {
    emit('<research-step type="synthesis" status="completed" />');
  }
}

