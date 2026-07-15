export const runtime = 'edge';

import { MODELS_REGISTRY } from '@/lib/models';
import {
  createProviderModel,
  readChatRequestHeaders,
} from '../_lib/providers';
import { formatResearchMessages } from './_lib/messages';
import {
  buildPlannerProviderOptions,
  buildSynthesisProviderOptions,
} from './_lib/providers';
import { createResearchStreamResponse } from './_lib/stream-response';
import type { ResearchRequestBody } from './_lib/types';

export async function POST(req: Request) {
  try {
    const { messages, model, systemPrompt } = (await req.json()) as ResearchRequestBody;
    console.log(`[DEEP RESEARCH API] Request: model=${model}, messages=${messages?.length}`);

    const modelConfig = MODELS_REGISTRY.find((candidate) => candidate.id === model);
    if (!modelConfig) {
      return new Response(JSON.stringify({ error: `Unsupported model: ${model}` }), {
        status: 400,
      });
    }

    const requestHeaders = readChatRequestHeaders(req);
    const searchKeys = {
      tavilyKey: requestHeaders.searchKeys.tavilyKey || process.env.TAVILY_API_KEY,
      exaKey: requestHeaders.searchKeys.exaKey || process.env.EXA_API_KEY,
      firecrawlKey:
        requestHeaders.searchKeys.firecrawlKey || process.env.FIRECRAWL_API_KEY,
    };

    let aiModel: any;
    try {
      aiModel = createProviderModel(modelConfig, requestHeaders.providerKeys, 'research');
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    const formattedMessages = formatResearchMessages(messages);
    console.log(`[DEEP RESEARCH] Prepared ${formattedMessages.length} messages.`);

    return createResearchStreamResponse({
      formattedMessages,
      aiModel,
      systemPrompt,
      searchKeys,
      plannerProviderOptions: buildPlannerProviderOptions(modelConfig, model),
      synthesisProviderOptions: buildSynthesisProviderOptions(modelConfig, model),
      signal: req.signal,
    });
  } catch (error: any) {
    console.error('[Deep Research API] Top-level error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 },
    );
  }
}
