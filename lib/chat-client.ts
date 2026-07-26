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

// How long a single reader.read() call can stall before we treat the
// connection as silently dropped (common on iOS Safari when the tab is
// backgrounded or the screen locks mid-stream).
const READ_TIMEOUT_MS = 90_000; // 90 seconds

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
      // Tell any intermediate proxy/CDN not to buffer this response
      'Accept': 'text/event-stream, text/plain',
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
    // keepalive: true allows the request to outlive page navigation on some
    // browsers, but more importantly it signals to the browser not to treat
    // this as an idle background connection eligible for early teardown.
    // Note: keepalive is incompatible with streaming response bodies in some
    // browsers, so we only set it on the non-streaming initial fetch.
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is null');

  const decoder = new TextDecoder();

  // Wraps reader.read() with a timeout so that if the mobile browser silently
  // drops the connection (no error, no done=true, just hangs), we throw a
  // detectable error rather than hanging forever.
  const readWithTimeout = (): Promise<ReadableStreamReadResult<Uint8Array>> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reader.cancel().catch(() => {});
        reject(new Error('Stream read timeout — connection may have been dropped'));
      }, READ_TIMEOUT_MS);

      reader.read().then(
        (result) => { clearTimeout(timer); resolve(result); },
        (err) => { clearTimeout(timer); reject(err); }
      );
    });
  };

  let streamBuffer = '';
  const prefixTarget = ': heartbeat';

  const getMatchingPrefixLength = (str: string, target: string): number => {
    for (let len = Math.min(str.length, target.length); len > 0; len--) {
      if (target.startsWith(str.slice(-len))) {
        return len;
      }
    }
    return 0;
  };

  try {
    while (true) {
      if (signal?.aborted) throw new Error('Aborted');

      const { done, value } = await readWithTimeout();
      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });
      streamBuffer += chunkText;

      // Remove any complete heartbeats (handle both Unix and Windows newlines)
      const heartbeatPatterns = [
        ': heartbeat\n\n',
        ': heartbeat\r\n\r\n',
        ': heartbeat\n',
        ': heartbeat\r\n',
        ': heartbeat'
      ];
      
      let replaced = true;
      while (replaced) {
        replaced = false;
        for (const pattern of heartbeatPatterns) {
          if (streamBuffer.includes(pattern)) {
            streamBuffer = streamBuffer.replace(pattern, '');
            replaced = true;
            break;
          }
        }
      }

      // Check if the end of the buffer matches a partial heartbeat
      const prefixLen = getMatchingPrefixLength(streamBuffer, prefixTarget);
      
      let flushText = streamBuffer;
      if (prefixLen > 0) {
        flushText = streamBuffer.slice(0, -prefixLen);
        streamBuffer = streamBuffer.slice(-prefixLen);
      } else {
        streamBuffer = '';
      }

      if (flushText.length > 0) {
        // Filter out heartbeat-only chunks (like the initial 2048 spaces)
        const isMeaningful = flushText.trim().length > 0 ||
          flushText.includes('<') ||
          flushText.includes('{');
          
        if (isMeaningful) {
          onToken(flushText);
        }
      }
    }
  } catch (err: any) {
    // Re-throw AbortError so the caller can distinguish user-stop from errors
    if (err?.name === 'AbortError' || err?.message === 'Aborted') throw err;
    console.error('Error reading chat stream:', err);
    throw err;
  } finally {
    try { reader.cancel(); } catch {}
  }
};
