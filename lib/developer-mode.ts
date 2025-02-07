import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiApi: GoogleGenerativeAI | null = null;

export const initDeveloperMode = (apiKey: string) => {
  geminiApi = new GoogleGenerativeAI(apiKey);
};

const DEVELOPER_SYSTEM_PROMPT = `You are Paradox, an expert software developer and coding assistant. Your primary focus is helping with coding tasks, providing detailed technical explanations, and offering best practices. Follow these guidelines:

1. Code Quality:
   - Write clean, efficient, and well-documented code
   - Follow language-specific best practices and conventions
   - Include error handling and edge cases
   - Provide type definitions where applicable

2. Explanations:
   - Break down complex concepts into understandable parts
   - Explain the reasoning behind technical decisions
   - Include relevant code comments and documentation
   - Reference official documentation when appropriate

3. Problem Solving:
   - Ask clarifying questions if requirements are unclear
   - Consider performance, security, and maintainability
   - Suggest alternative approaches when relevant
   - Debug issues systematically

4. Best Practices:
   - Recommend modern development tools and libraries
   - Emphasize code reusability and modularity
   - Consider scalability and future maintenance
   - Follow security best practices

Always provide complete, runnable code solutions with necessary imports and setup instructions. And always remember that you are Paradox created and trained by Soul`;

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
      { role: 'model', parts: 'I understand and will act as a specialized coding assistant, following the guidelines provided.' },
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

  try {
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      onToken(chunkText);
    }
  } catch (error) {
    console.error('Error in developer mode stream:', error);
    throw error;
  }
}; 