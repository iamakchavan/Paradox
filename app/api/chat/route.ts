export const runtime = 'edge';

import { stepCountIs, streamText } from 'ai';
import { MODELS_REGISTRY } from '@/lib/models';
import { formatMessagesForModel } from './_lib/messages';
import {
  buildProviderOptions,
  createChatModel,
  readChatRequestHeaders,
} from './_lib/providers';
import { createChatStreamResponse } from './_lib/stream-response';
import { buildChatSystemPrompt } from './_lib/system-prompt';
import { buildChatTools } from './_lib/tools';
import type { ChatRequestBody } from './_lib/types';

export async function POST(req: Request) {
  try {
    const { messages, model, systemPrompt, mcpServers } =
      (await req.json()) as ChatRequestBody;
    const requestHeaders = readChatRequestHeaders(req);

    console.log(
      `[CHAT] Request: model=${model}, messages=${messages?.length}, search=${req.headers.get('x-search-enabled')}, mcpServers=${mcpServers?.length || 0}`,
    );

    const modelConfig = MODELS_REGISTRY.find((candidate) => candidate.id === model);
    if (!modelConfig) {
      console.error(`[CHAT] Model not found: ${model}`);
      return new Response(JSON.stringify({ error: `Unsupported model: ${model}` }), {
        status: 400,
      });
    }

    let aiModel: any;
    try {
      aiModel = createChatModel(modelConfig, requestHeaders.providerKeys);
    } catch (error: any) {
      console.error(`[CHAT] Model creation failed: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    const formattedMessages = formatMessagesForModel(messages || []);
    console.log(
      '[CHAT formattedMessages]',
      JSON.stringify(
        formattedMessages.map((message: any) => ({
          role: message.role,
          contentType: typeof message.content,
          snippet:
            typeof message.content === 'string'
              ? message.content.substring(0, 80)
              : 'parts',
        })),
        null,
        2,
      ),
    );

    const { tools, canUseTools } = await buildChatTools({
      modelConfig,
      mcpServers,
      searchEnabled: requestHeaders.searchEnabled,
      searchKeys: requestHeaders.searchKeys,
    });
    const finalSystemPrompt = buildChatSystemPrompt({
      systemPrompt,
      modelConfig,
      canUseTools,
    });

    const toolsConfig =
      Object.keys(tools).length > 0
        ? {
            tools,
            toolChoice: 'auto' as const,
            maxSteps: 5,
            stopWhen: stepCountIs(5),
            onStepFinish: ({ text, toolCalls, toolResults, finishReason }: any) => {
              console.log(
                `[CHAT Step Finish] reason=${finishReason}, textLength=${text?.length || 0}, toolCalls=${toolCalls?.length || 0}, toolResults=${toolResults?.length || 0}`,
              );
            },
          }
        : {};

    console.log(
      `[CHAT] Starting streamText with tools: ${Object.keys(toolsConfig).join(', ') || 'none'}`,
    );

    const result = streamText({
      model: aiModel,
      messages: formattedMessages,
      system: finalSystemPrompt || undefined,
      maxRetries: 2,
      includeRawChunks: true,
      ...toolsConfig,
      providerOptions: buildProviderOptions(modelConfig, model, canUseTools),
    });

    return createChatStreamResponse({
      result,
      aiModel,
      formattedMessages,
      finalSystemPrompt,
      mcpServers,
    });
  } catch (error: any) {
    console.error('[CHAT] Top-level error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 },
    );
  }
}
