export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  pdfs?: { name: string; data: string }[];
}

export interface StreamKeys {
  geminiApiKey?: string | null;
  mistralApiKey?: string | null;
  perplexityApiKey?: string | null;
  zenmuxApiKey?: string | null;
  inceptionApiKey?: string | null;
  nvidiaApiKey?: string | null;
  tavilyApiKey?: string | null;
  exaApiKey?: string | null;
  firecrawlApiKey?: string | null;
}

export const streamChatContent = async (
  messages: ChatMessage[],
  model: string,
  keys: StreamKeys,
  searchEnabled: boolean,
  researchEnabled: boolean,
  onToken: (token: string) => void,
  signal?: AbortSignal
) => {
  const endpoint = researchEnabled ? '/api/chat/research' : '/api/chat';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key-gemini': keys.geminiApiKey || '',
      'x-api-key-mistral': keys.mistralApiKey || '',
      'x-api-key-perplexity': keys.perplexityApiKey || '',
      'x-api-key-zenmux': keys.zenmuxApiKey || '',
      'x-api-key-inception': keys.inceptionApiKey || '',
      'x-api-key-nvidia': keys.nvidiaApiKey || '',
      'x-api-key-tavily': keys.tavilyApiKey || '',
      'x-api-key-exa': keys.exaApiKey || '',
      'x-api-key-firecrawl': keys.firecrawlApiKey || '',
      'x-search-enabled': searchEnabled ? 'true' : 'false',
    },
    body: JSON.stringify({
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        images: msg.images,
        pdfs: msg.pdfs
      })),
      model,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is null');

  const decoder = new TextDecoder();

  try {
    while (true) {
      if (signal?.aborted) throw new Error('Aborted');
      const { done, value } = await reader.read();
      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });
      onToken(chunkText);
    }
  } catch (err) {
    console.error('Error reading chat stream:', err);
    throw err;
  }
};
