"use client";

import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomToast } from '@/components/ui/custom-toast';
import type { ApiKeys } from '@/hooks/use-api-keys';
import { addMessageToSession, branchOffChat, createChatSession } from '@/hooks/use-chat-history';
import { db } from '@/lib/db';
import type { ChatMessage, ChatPdfAttachment } from '../_lib/types';

interface Options {
  chatId: string | null;
  messages: ChatMessage[];
  streamingMessage: ChatMessage | null;
  apiKeys: ApiKeys;
  selectedModelId: string;
  setSelectedModelId: Dispatch<SetStateAction<string>>;
  selectedImages: string[];
  selectedPDFs: ChatPdfAttachment[];
  clearAttachments: () => void;
  persistIntegrationsForChat: (chatId: string) => void;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setStreamingMessage: Dispatch<SetStateAction<ChatMessage | null>>;
  setIsInitialView: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setIsLoading: (value: boolean) => void;
  handleStop: () => void;
  runStreaming: (chatId: string, modelId: string, history: ChatMessage[], user: ChatMessage, assistantId: number) => Promise<void>;
  triggerTitleGeneration: (chatId: string, query: string, modelId: string) => Promise<void>;
  conversationRef: MutableRefObject<ChatMessage[]>;
  isNewChatCreatedRef: MutableRefObject<boolean>;
  initialMessageCountRef: MutableRefObject<number>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  closeSidebarSurfaces: () => void;
}

export function useChatActions(options: Options) {
  const router = useRouter();
  const { showToast } = useCustomToast();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const selectedModelIdRef = useRef(options.selectedModelId);
  useEffect(() => {
    selectedModelIdRef.current = options.selectedModelId;
  }, [options.selectedModelId]);

  const resetToNewChat = useCallback((replaceRoute: boolean) => {
    const current = optionsRef.current;
    current.handleStop();
    current.closeSidebarSurfaces();
    if (replaceRoute) {
      router.replace('/chat');
    } else {
      router.push('/chat');
    }
    current.setMessages([]);
    current.setError(null);
    current.setIsInitialView(true);
    current.clearAttachments();
    current.setSelectedModelId('sonar');
    current.initialMessageCountRef.current = 0;
  }, [router]);

  const handleNewChat = useCallback(() => {
    resetToNewChat(false);
  }, [resetToNewChat]);

  const handleActiveChatDeleted = useCallback(() => {
    resetToNewChat(true);
  }, [resetToNewChat]);

  const handleSubmit = useCallback(async (text: string) => {
    const current = optionsRef.current;
    const hasProviderKey = current.apiKeys.geminiApiKey
      || current.apiKeys.mistralApiKey
      || current.apiKeys.perplexityApiKey
      || current.apiKeys.zenmuxApiKey
      || current.apiKeys.nvidiaApiKey
      || current.apiKeys.inceptionApiKey;
    if ((!text.trim() && current.selectedImages.length === 0 && current.selectedPDFs.length === 0)
      || !hasProviderKey) return;

    const promptMessage = text;
    const promptImages = current.selectedImages.length > 0 ? [...current.selectedImages] : undefined;
    const promptPDFs = current.selectedPDFs.length > 0 ? [...current.selectedPDFs] : undefined;
    current.clearAttachments();
    current.setError(null);
    const isNewChat = !current.chatId
      || (current.messages.length === 0 && !current.streamingMessage);

    if (isNewChat) {
      current.setIsInitialView(false);
      current.setIsLoading(true);
      const title = promptMessage.trim().substring(0, 30) || 'New Chat';
      const newChatId = await createChatSession(current.selectedModelId, title);
      current.isNewChatCreatedRef.current = true;
      await addMessageToSession(newChatId, 'user', promptMessage, promptImages, promptPDFs);
      await addMessageToSession(newChatId, 'assistant', '');
      current.persistIntegrationsForChat(newChatId);
      sessionStorage.setItem(`pending-stream-${newChatId}`, JSON.stringify({
        promptMessage,
        promptImages,
        promptPDFs,
        modelId: current.selectedModelId,
      }));
      router.push(`/chat/${newChatId}`);
      return;
    }

    current.setIsLoading(true);
    const userMessageId = await addMessageToSession(
      current.chatId!,
      'user',
      promptMessage,
      promptImages,
      promptPDFs,
    );
    current.setMessages(previous => [...previous, {
      id: userMessageId,
      role: 'user',
      content: promptMessage,
      images: promptImages,
      pdfs: promptPDFs,
    }]);
    const assistantMessageId = await addMessageToSession(current.chatId!, 'assistant', '');
    current.setStreamingMessage({ id: assistantMessageId, role: 'assistant', content: '' });
    setTimeout(() => current.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: promptMessage,
      images: promptImages,
      pdfs: promptPDFs,
    };
    const storedMessages = await db.messages
      .where('chatId')
      .equals(current.chatId!)
      .sortBy('createdAt');
    const completedHistory = storedMessages
      .filter(message => message.id !== userMessageId && message.id !== assistantMessageId)
      .map(message => ({
        id: message.id,
        role: message.role as 'user' | 'assistant',
        content: message.content,
        images: message.images,
        pdfs: message.pdfs,
      }));
    await current.runStreaming(
      current.chatId!,
      current.selectedModelId,
      completedHistory,
      userMessage,
      assistantMessageId,
    );
  }, [router]);

  const handleBranchOff = useCallback(async (messageIndex: number) => {
    const current = optionsRef.current;
    if (!current.chatId) return;
    try {
      const newChatId = await branchOffChat(
        current.chatId,
        messageIndex,
        selectedModelIdRef.current,
      );
      const firstUserMessage = current.conversationRef.current.find(message => message.role === 'user');
      if (firstUserMessage) {
        void current.triggerTitleGeneration(
          newChatId,
          firstUserMessage.content,
          selectedModelIdRef.current,
        );
      }
      showToast({
        title: 'Conversation branched',
        message: 'New chat created preserving history up to this point.',
        type: 'success',
      });
      router.push(`/chat/${newChatId}`);
    } catch (error) {
      console.error('Failed to branch off chat:', error);
      showToast({
        title: 'Failed to branch',
        message: 'There was a problem branching this conversation.',
        type: 'error',
      });
    }
  }, [router, showToast]);

  return { handleNewChat, handleActiveChatDeleted, handleSubmit, handleBranchOff };
}
