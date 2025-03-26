import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiApi: GoogleGenerativeAI | null = null;

export const initGemini = (apiKey: string) => {
  try {
    if (!apiKey) {
      console.error('No API key provided to initGemini');
      return;
    }
    geminiApi = new GoogleGenerativeAI(apiKey);
    console.log('Gemini API initialized successfully');
  } catch (error) {
    console.error('Error initializing Gemini API:', error);
    throw error;
  }
};

export const getGeminiApi = () => {
  if (!geminiApi) {
    throw new Error('Gemini API not initialized. Please set your API key in settings.');
  }
  return geminiApi;
};

// Helper function to convert base64 to Uint8Array
const base64ToUint8Array = (base64: string) => {
  const base64String = base64.split(',')[1];
  const binaryString = window.atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  pdfs?: { name: string; data: string }[];
}

export const streamGenerateContent = async (
  message: string,
  history: ChatMessage[],
  onToken: (token: string) => void
) => {
  const api = getGeminiApi();
  if (!api) throw new Error('Gemini API not initialized');

  const model = api.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Create chat history for context
  const chat = model.startChat({
    history: [
      { 
        role: 'user', 
        parts: `You are a helpful AI assistant with expertise in software development. Be clear and thorough in your responses:

1. Explain concepts clearly and provide context
2. When showing code:
   - Include necessary imports and setup
   - Use appropriate code blocks
   - Format directory structures like this:

\`\`\`plaintext
project/
├── src/
│   ├── components/
│   └── utils/
└── package.json
\`\`\`

3. Balance explanations with code examples
4. Be conversational and engaging

Now proceed with the conversation.`
      },
      {
        role: 'model',
        parts: 'I understand. I will be helpful and clear while providing well-structured code and explanations.'
      },
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }))
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
    },
  });

  const lastMessage = history[history.length - 1];
  const parts: any[] = [{ text: message }];

  // Add images if present
  if (lastMessage.images && lastMessage.images.length > 0) {
    lastMessage.images.forEach(image => {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: image.split(',')[1] // Remove the data URL prefix
        }
      });
    });
  }

  // Add PDFs if present
  if (lastMessage.pdfs && lastMessage.pdfs.length > 0) {
    lastMessage.pdfs.forEach(pdf => {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: pdf.data.split(',')[1] // Remove the data URL prefix
        }
      });
    });
  }

  try {
    const result = await chat.sendMessageStream(parts);
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
    console.error('Error in Gemini stream:', error);
    throw error;
  }
};