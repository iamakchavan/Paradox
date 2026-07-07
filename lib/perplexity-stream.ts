/**
 * Helper to adapt and translate Perplexity Agent API / Responses API SSE stream chunks
 * into standard OpenAI-compatible chat completion chunks (`chat.completion.chunk`).
 * 
 * This ensures full compatibility with the Vercel AI SDK stream parsing engine.
 */
export function makeOpenAiCompatibleStream(perplexityResponse: Response): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

  return new ReadableStream({
    async start(controller) {
      reader = perplexityResponse.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Save incomplete line fragment to buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }

              try {
                const dataObj = JSON.parse(dataStr);
                
                // 1. Resolve text delta content (handles root 'delta' and standard choices structure)
                let deltaText = dataObj.delta;
                if (deltaText === undefined && dataObj.choices?.[0]?.delta?.content !== undefined) {
                  deltaText = dataObj.choices[0].delta.content;
                }

                // 2. Resolve tool call delta structure
                const toolCalls = dataObj.tool_calls || dataObj.choices?.[0]?.delta?.tool_calls;

                // Stream text chunk if present
                if (deltaText !== undefined) {
                  const chatChunk = {
                    id: dataObj.id || 'chatcmpl-chunk',
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: dataObj.model,
                    choices: [
                      {
                        index: 0,
                        delta: {
                          content: deltaText
                        },
                        finish_reason: null
                      }
                    ]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chatChunk)}\n\n`));
                }

                // Stream tool calls chunk if present
                if (toolCalls !== undefined) {
                  const chatChunk = {
                    id: dataObj.id || 'chatcmpl-chunk',
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: dataObj.model,
                    choices: [
                      {
                        index: 0,
                        delta: {
                          tool_calls: toolCalls
                        },
                        finish_reason: null
                      }
                    ]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chatChunk)}\n\n`));
                }
              } catch (e) {
                // Ignore JSON parsing errors for partial or malformed chunks
              }
            }
          }
        }
        
        // Flush remaining decoder contents
        buffer += decoder.decode();
      } catch (err) {
        controller.error(err);
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
    cancel(reason) {
      if (reader) {
        reader.cancel(reason).catch(() => {});
      }
    }
  });
}
