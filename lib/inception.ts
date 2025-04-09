let inceptionApiKey: string | null = null;

export const initInception = (apiKey: string) => {
  inceptionApiKey = apiKey;
  return apiKey;
};

export const getInceptionApi = () => {
  if (!inceptionApiKey) {
    throw new Error('Inception Labs API not initialized. Please set your API key in settings.');
  }
  return inceptionApiKey;
};

export const streamInceptionContent = async (
  message: string,
  history: { role: string; content: string; images?: string[] }[],
  onToken: (token: string) => void
) => {
  const response = await fetch('https://api.inceptionlabs.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${inceptionApiKey}`
    },
    body: JSON.stringify({
      model: 'mercury-coder-small',
      messages: [
        ...history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1000,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate response from Inception Labs API');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Failed to read response');

  const decoder = new TextDecoder();
  let buffer = '';
  let lastUpdateTime = Date.now();
  let totalLength = 0;

  // Dynamic chunk sizing and delay calculation
  const getChunkConfig = (length: number) => {
    if (length > 2000) return { words: 15, delay: 15 };
    if (length > 1000) return { words: 10, delay: 20 };
    return { words: 5, delay: 25 };
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    totalLength += buffer.length;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim() === '') continue;
      if (line.trim() === 'data: [DONE]') continue;

      try {
        const data = JSON.parse(line.replace(/^data: /, ''));
        const token = data.choices[0]?.delta?.content || '';
        
        if (token) {
          const { words, delay } = getChunkConfig(totalLength);
          const timeSinceLastUpdate = Date.now() - lastUpdateTime;

          // Add controlled delay for smoother animation
          if (timeSinceLastUpdate >= delay) {
            onToken(token);
            lastUpdateTime = Date.now();
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            buffer += token;
          }
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    }
  }

  // Send any remaining buffered content
  if (buffer) {
    onToken(buffer);
  }
}; 