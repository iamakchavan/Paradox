import { createOpenAI } from '@ai-sdk/openai';
import { headers } from 'next/headers';
import { makeOpenAiCompatibleStream } from './perplexity-stream';

/**
 * Creates a Vercel AI SDK compatible LanguageModel instance for Perplexity.
 * 
 * ARCHITECTURAL NOTE:
 * Perplexity's standard `/chat/completions` endpoint only supports their native search-grounded
 * "Sonar" models. Any third-party models (e.g. `openai/gpt-5-mini`, `anthropic/claude-sonnet-5`)
 * are hosted exclusively under Perplexity's Agent API (endpoints: `POST /v1/agent` or standard
 * OpenAI responses alias `POST /v1/responses`).
 * 
 * Since the Vercel AI SDK's OpenAI provider hardcodes appending `/chat/completions` to the baseURL,
 * we use the official custom `fetch` injection hook to transparently adapt standard OpenAI chat completion
 * requests into the Agent API schema, and translate custom SSE delta streams back to chat completion chunks.
 */
export function getPerplexityModel(
  perplexityKey: string, 
  modelId: string,
  context: 'chat' | 'research' | 'title'
) {
  // Agent API models are identified by having a slash in the model ID (e.g. `openai/gpt-5-mini`)
  const isAgentModel = modelId.includes('/');
  
  if (isAgentModel) {
    return createOpenAI({
      apiKey: perplexityKey,
      baseURL: 'https://api.perplexity.ai/v1',
      fetch: async (url, options) => {
        if (options?.method === 'POST' && options.body) {
          try {
            const body = JSON.parse(options.body as string);
            const messages = body.messages || [];
            
            // Extract system prompt to map to Perplexity Agent API's `instructions` field
            const systemMessage = messages.find((m: any) => m.role === 'system');
            const userMessages = messages.filter((m: any) => m.role !== 'system');

            // Sanitize messages for Perplexity input schema to keep ONLY role/content and prevent 400 validation error
            const sanitizedInput = userMessages.map((m: any) => {
              let textContent = '';
              if (typeof m.content === 'string') {
                textContent = m.content;
              } else if (Array.isArray(m.content)) {
                // If content is structured as array of parts (e.g. text/image)
                textContent = m.content
                  .filter((part: any) => part.type === 'text')
                  .map((part: any) => part.text)
                  .join('\n');
              }
              return {
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: textContent,
              };
            });
            
            // Inspect the header to see if the user enabled search in the UI
            const reqHeaders = await headers().catch(() => null);
            const searchEnabled = reqHeaders?.get('x-search-enabled') === 'true';

            const agentBody: Record<string, any> = {
              model: body.model,
              input: sanitizedInput.length === 1 ? sanitizedInput[0].content : sanitizedInput,
              instructions: systemMessage ? systemMessage.content : undefined,
              stream: body.stream,
              max_output_tokens: body.max_tokens || 4096,
            };

            // Dynamically assign preset and tools based on route context and search flag
            if (context === 'research') {
              // Deep Research route -> Use 'medium' preset (Deep Research loop) and pass custom tools
              agentBody.preset = 'medium';
              if (body.tools && body.tools.length > 0) {
                agentBody.tools = body.tools;
              }
            } else if (context === 'chat' && searchEnabled) {
              // Regular Chat with Search enabled -> Bind Perplexity's 4 vertical tools + custom tools
              agentBody.tools = [
                { type: 'web_search' },
                { type: 'fetch_url' },
                { type: 'people_search' },
                { type: 'finance_search' },
                ...(body.tools || [])
              ];
            } else {
              // Search disabled / title generation -> Omit all Perplexity search tools, pass only custom tools
              if (body.tools && body.tools.length > 0) {
                agentBody.tools = body.tools;
              }
            }

            // Call the correct Perplexity Responses API alias endpoint
            const response = await fetch('https://api.perplexity.ai/v1/agent', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${perplexityKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(agentBody),
              signal: options.signal // Forward abort signals for production-grade connection lifecycle
            });

            // Handle API errors gracefully
            if (!response.ok) {
              const errorText = await response.text();
              return new Response(errorText, {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            // Non-streaming completion format adaptation
            if (!body.stream) {
              const json = await response.json();
              const text = json.output?.[0]?.content?.[0]?.text || "";
              const mockResponse = {
                id: json.id || 'chatcmpl-mock',
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: json.model,
                choices: [
                  {
                    index: 0,
                    message: {
                      role: 'assistant',
                      content: text
                    },
                    finish_reason: 'stop'
                  }
                ]
              };
              return new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            // Streaming completion format adaptation (SSE translation via modular stream helper)
            const transformStream = makeOpenAiCompatibleStream(response);

            return new Response(transformStream, {
              status: 200,
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              }
            });
          } catch (e) {
            console.error('Error in Perplexity Agent API proxy:', e);
            return new Response(JSON.stringify({ error: 'Proxy request adaptation failed' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        return fetch(url, options);
      }
    }).chat(modelId);
  }

  // Default Sonar models route
  return createOpenAI({
    apiKey: perplexityKey,
    baseURL: 'https://api.perplexity.ai',
  }).chat(modelId);
}
