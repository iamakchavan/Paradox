import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiApi: GoogleGenerativeAI | null = null;

export const initDeveloperMode = (apiKey: string) => {
  geminiApi = new GoogleGenerativeAI(apiKey);
};

const DEVELOPER_SYSTEM_PROMPT = `You are Paradox, a specialized coding assistant focused on providing detailed, step-by-step implementations. For every coding request:

1. Implementation Steps:
   - Start with a clear overview of what will be built
   - Break down the implementation into numbered steps
   - Provide detailed code for each step
   - Include commands to run at each stage

2. Code Structure:
   - Show directory structure in \`\`\`plaintext blocks
   - Provide complete code with imports and dependencies
   - Include configuration files and environment setup
   - Add error handling and logging

3. Setup Instructions:
   - List all required dependencies with versions
   - Show exact commands to initialize the project
   - Include build/run commands
   - Provide testing instructions

4. Best Practices:
   - Add comments explaining complex logic
   - Include type definitions and interfaces
   - Show proper error handling patterns
   - Demonstrate logging and debugging

Always structure your responses as:
1. Overview of what we're building
2. Step-by-step implementation with code
3. Setup and running instructions
4. Usage examples and testing

Remember to be thorough and code-focused while keeping instructions clear and actionable. You are Paradox created and trained by Soul.`;

export const streamDeveloperContent = async (
  message: string,
  history: { role: string; content: string }[],
  onToken: (token: string) => void
) => {
  if (!geminiApi) throw new Error('Developer mode not initialized');

  const model = geminiApi.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const chat = model.startChat({
    history: [
      { role: 'user', parts: DEVELOPER_SYSTEM_PROMPT },
      { role: 'model', parts: 'I understand. I will provide detailed, step-by-step code implementations with clear instructions.' },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'model',
        parts: msg.content
      }))
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
    },
  });

  const result = await chat.sendMessageStream(message);
  let buffer = '';
  let lastUpdateTime = Date.now();
  let totalLength = 0;
  
  // Dynamic chunk sizing and delay calculation
  const getChunkConfig = (length: number) => {
    if (length > 5000) return { words: 25, delay: 10 };
    if (length > 2000) return { words: 15, delay: 20 };
    if (length > 1000) return { words: 10, delay: 25 };
    return { words: 5, delay: 30 };
  };

  try {
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      buffer += chunkText;
      totalLength += chunkText.length;

      const { words, delay } = getChunkConfig(totalLength);
      const timeSinceLastUpdate = Date.now() - lastUpdateTime;

      // Process buffer if we have enough words or enough time has passed
      if (timeSinceLastUpdate >= delay * 2) {
        const words = buffer.split(' ');
        const chunkSize = Math.min(words.length, Math.ceil(buffer.length / 50)); // Dynamic chunk size
        
        while (words.length >= chunkSize) {
          const chunk = words.splice(0, chunkSize).join(' ') + ' ';
          onToken(chunk);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        buffer = words.join(' ');
        lastUpdateTime = Date.now();
      }
    }

    // Send remaining buffer
    if (buffer) {
      onToken(buffer);
    }
  } catch (error) {
    console.error('Error in developer mode stream:', error);
    throw error;
  }
}; 