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
    history: history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    })),
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
    let lastChunkTime = Date.now();
    const MIN_CHUNK_DELAY = 50; // Minimum delay between chunks

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      buffer += chunkText;

      // Add controlled delay between chunks
      const timeSinceLastChunk = Date.now() - lastChunkTime;
      if (timeSinceLastChunk < MIN_CHUNK_DELAY) {
        await new Promise(resolve => setTimeout(resolve, MIN_CHUNK_DELAY - timeSinceLastChunk));
      }

      // Send buffer in smaller chunks for smoother appearance
      const words = buffer.split(' ');
      while (words.length > 3) { // Send 3 words at a time
        const chunk = words.splice(0, 3).join(' ') + ' ';
        onToken(chunk);
        await new Promise(resolve => setTimeout(resolve, 30)); // Small delay between word groups
      }
      buffer = words.join(' ');
      lastChunkTime = Date.now();
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