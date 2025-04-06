let mistralApiKey: string | null = null;

export const initMistral = (apiKey: string) => {
  mistralApiKey = apiKey;
  return apiKey;
};

export const getMistralApi = () => {
  if (!mistralApiKey) {
    throw new Error('Mistral API not initialized. Please set your API key in settings.');
  }
  return mistralApiKey;
};

export const streamMistralContent = async (
  message: string,
  history: { role: string; content: string }[],
  onToken: (token: string) => void
) => {
  const api = getMistralApi();
  
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          ...history,
          { role: 'user', content: message }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // Append new chunk to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

        const data = trimmedLine.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onToken(content);
          }
        } catch (e) {
          console.error('Error parsing SSE message:', e);
          // Continue processing other lines even if one fails
          continue;
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      const trimmedLine = buffer.trim();
      if (trimmedLine.startsWith('data: ')) {
        const data = trimmedLine.slice(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onToken(content);
            }
          } catch (e) {
            console.error('Error parsing final SSE message:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in streamMistralContent:', error);
    throw error;
  }
}; 