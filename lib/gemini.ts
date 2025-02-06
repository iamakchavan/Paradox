import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiApi: GoogleGenerativeAI | null = null;

export const initGemini = (apiKey: string) => {
  geminiApi = new GoogleGenerativeAI(apiKey);
  return geminiApi;
};

export const getGeminiApi = () => {
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
}

export const streamGenerateContent = async (
  prompt: string,
  history: ChatMessage[],
  onToken: (token: string) => void
) => {
  if (!geminiApi) throw new Error('Gemini API not initialized');
  
  const model = geminiApi.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  // Prepare the content parts
  const parts: any[] = [];

  // Add text prompt
  if (prompt.trim()) {
    parts.push({ text: prompt });
  }

  // Add images if present in the last user message
  const lastMessage = history[history.length - 1];
  const hasImages = lastMessage?.role === 'user' && Array.isArray(lastMessage.images) && lastMessage.images.length > 0;
  
  if (hasImages && lastMessage.images) {
    for (const imageBase64 of lastMessage.images) {
      try {
        const imageData = base64ToUint8Array(imageBase64);
        parts.push({
          inlineData: {
            data: Buffer.from(imageData).toString('base64'),
            mimeType: 'image/jpeg'
          }
        });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
  }

  try {
    // For messages with images, use direct generation
    if (parts.length > 1) {
      const result = await model.generateContentStream(parts);
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        onToken(chunkText);
      }
    } else {
      // For text-only messages, use chat history
      const chatModel = geminiApi.getGenerativeModel({ model: "gemini-2.0-flash" });
      const chat = chatModel.startChat({
        history: history.slice(0, -1).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: msg.content,
        })),
      });

      const result = await chat.sendMessageStream(prompt);
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        onToken(chunkText);
      }
    }
  } catch (error) {
    console.error('Error in streamGenerateContent:', error);
    throw error;
  }
};