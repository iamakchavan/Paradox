import { Message } from '@/types/chat';
import { streamGenerateContent } from '@/lib/gemini';
import { streamPerplexityContent } from '@/lib/perplexity';
import { streamDeveloperContent } from '@/lib/developer-mode';
import { processThinkingContent } from '@/utils/chat';

interface MessageHandlerProps {
  message: string;
  history: Message[];
  selectedImages?: string[];
  selectedPDFs?: { name: string; data: string }[];
  useDeveloperMode: boolean;
  useWebSearch: boolean;
  useReasoning: boolean;
  geminiApiKey: string | null;
  perplexityApiKey: string | null;
  onUpdateConversation: (updater: (prev: Message[]) => Message[]) => void;
  onError: (error: string) => void;
}

export const handleMessageSubmission = async ({
  message,
  history,
  selectedImages = [],
  selectedPDFs = [],
  useDeveloperMode,
  useWebSearch,
  useReasoning,
  geminiApiKey,
  perplexityApiKey,
  onUpdateConversation,
  onError
}: MessageHandlerProps) => {
  let streamedText = '';
  let isThinking = false;

  try {
    if (useDeveloperMode && geminiApiKey) {
      await streamDeveloperContent(
        message,
        history,
        (token) => handleStreamToken(token, isThinking, streamedText, onUpdateConversation)
      );
    } else if ((useWebSearch || useReasoning) && perplexityApiKey) {
      await streamPerplexityContent(
        message,
        history,
        (token) => handleStreamToken(token, isThinking, streamedText, onUpdateConversation),
        useReasoning ? 'sonar-reasoning' : 'sonar'
      );
    } else {
      await streamGenerateContent(
        message,
        [...history, { role: 'user', content: message, images: selectedImages, pdfs: selectedPDFs }],
        (token) => {
          streamedText += token;
          onUpdateConversation(prev => {
            const newConv = [...prev];
            newConv[newConv.length - 1] = {
              role: 'assistant',
              content: streamedText
            };
            return newConv;
          });
        }
      );
    }
  } catch (error) {
    console.error('Error in message submission:', error);
    onError(error instanceof Error ? error.message : 'Failed to generate response. Please try again.');
    onUpdateConversation(prev => prev.slice(0, -1));
  }
};

const handleStreamToken = (
  token: string,
  isThinking: boolean,
  streamedText: string,
  onUpdateConversation: (updater: (prev: Message[]) => Message[]) => void
) => {
  if (token.includes('<think>')) {
    isThinking = true;
    streamedText = '';
    return;
  }
  if (token.includes('</think>')) {
    isThinking = false;
    streamedText = '';
    return;
  }
  streamedText += token;
  onUpdateConversation(prev => {
    const newConv = [...prev];
    const lastMessage = newConv[newConv.length - 1];
    if (isThinking) {
      newConv[newConv.length - 1] = {
        ...lastMessage,
        content: `<think>${streamedText}</think>`
      };
    } else {
      const { thinking } = processThinkingContent(lastMessage.content);
      newConv[newConv.length - 1] = {
        ...lastMessage,
        content: thinking ? `<think>${thinking}</think>${streamedText}` : streamedText
      };
    }
    return newConv;
  });
}; 