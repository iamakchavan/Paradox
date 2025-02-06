let perplexityApiKey: string | null = null;

export const initPerplexity = (apiKey: string) => {
  perplexityApiKey = apiKey;
  return apiKey;
};

export const getPerplexityApi = () => {
  return perplexityApiKey;
};

interface Message {
  role: string;
  content: string;
}

export const streamPerplexityContent = async (
  prompt: string,
  history: { role: string; content: string }[],
  onToken: (token: string) => void,
  model: 'sonar' | 'sonar-reasoning' = 'sonar'
) => {
  if (!perplexityApiKey) throw new Error('Perplexity API not initialized');

  try {
    const messages: Message[] = [
      {
        role: 'system',
        content: model === 'sonar' 
          ? 'You are a helpful AI assistant with real-time web search capabilities. Provide accurate and up-to-date information.'
          : 'You are a reasoning-focused AI assistant. Break down problems step by step and provide detailed logical analysis.'
      },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: prompt }
    ];

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              onToken(content);
            }
          } catch (e) {
            console.error('Error parsing SSE message:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in streamPerplexityContent:', error);
    throw error;
  }
};