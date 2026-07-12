"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import { db } from '@/lib/db';
import { MODELS_REGISTRY } from '@/lib/models';
import type { ChatMessage } from '../_lib/types';

interface Options {
  chatId: string | null;
  messages: ChatMessage[];
  streamingMessage: ChatMessage | null;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setStreamingMessage: Dispatch<SetStateAction<ChatMessage | null>>;
  setSelectedModelId: Dispatch<SetStateAction<string>>;
  setIsInitialView: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  isLoading: boolean;
  isInitialView: boolean;
  isLoadingRef: MutableRefObject<boolean>;
  handleStop: () => void;
  clearAttachments: () => void;
  runStreaming: (chatId: string, modelId: string, history: ChatMessage[], user: ChatMessage, assistantId: number) => Promise<void>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function useChatHistoryState(options: Options) {
  const {
    chatId, messages, streamingMessage, setMessages, setStreamingMessage,
    setSelectedModelId, setIsInitialView, setError, isLoading, isInitialView, isLoadingRef,
    handleStop, clearAttachments, runStreaming, scrollContainerRef, messagesEndRef,
  } = options;
  const [loadedLimit, setLoadedLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(() => {
    if (!chatId) return false;
    if (typeof window !== 'undefined' && sessionStorage.getItem(`pending-stream-${chatId}`)) return false;
    return true;
  });
  const isLoadingHistoryRef = useRef(isLoadingHistory);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<{ id: number | string; relativeTop: number } | null>(null);
  const conversationRef = useRef<ChatMessage[]>([]);
  const initialMessageCountRef = useRef(0);
  const isNewChatCreatedRef = useRef(false);
  conversationRef.current = messages;

  const setLoadingHistory = useCallback((value: boolean) => {
    setIsLoadingHistory(value);
    isLoadingHistoryRef.current = value;
  }, []);

  useEffect(() => {
    const pendingKey = chatId ? `pending-stream-${chatId}` : '';
    const hasPending = Boolean(pendingKey && sessionStorage.getItem(pendingKey));
    if (!hasPending) handleStop();
    setLoadedLimit(20);
    setMessages([]);
    setIsInitialView(!chatId);
    setLoadingHistory(Boolean(chatId && !hasPending));
  }, [chatId, handleStop, setIsInitialView, setLoadingHistory, setMessages]);

  useEffect(() => {
    if (!chatId) return;
    db.messages.where('chatId').equals(chatId).count().then(count => {
      setHasMore(count > messages.length + (streamingMessage ? 1 : 0));
    });
  }, [chatId, messages.length, streamingMessage]);

  useEffect(() => {
    if (isInitialView || messages.length === 0 || !hasMore || isLoadingHistory || isLoading) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      const firstId = conversationRef.current[0]?.id ?? 0;
      const container = scrollContainerRef.current;
      const anchor = container?.querySelector(`#msg-${firstId}`);
      if (container && anchor) {
        scrollAnchorRef.current = {
          id: firstId,
          relativeTop: anchor.getBoundingClientRect().top - container.getBoundingClientRect().top,
        };
      }
      setLoadingHistory(true);
      setLoadedLimit(previous => previous + 20);
    }, { threshold: 0.1 });
    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => { if (sentinel) observer.unobserve(sentinel); };
  }, [hasMore, isInitialView, isLoading, isLoadingHistory, messages.length, scrollContainerRef, setLoadingHistory]);

  useLayoutEffect(() => {
    const saved = scrollAnchorRef.current;
    if (!saved) return;
    const container = scrollContainerRef.current;
    const anchor = container?.querySelector(`#msg-${saved.id}`);
    if (container && anchor) {
      container.scrollTop += anchor.getBoundingClientRect().top
        - container.getBoundingClientRect().top
        - saved.relativeTop;
    }
    scrollAnchorRef.current = null;
  }, [isLoadingHistory, messages.length, scrollContainerRef]);

  useEffect(() => {
    if (!chatId) {
      handleStop();
      setMessages([]);
      setStreamingMessage(null);
      setIsInitialView(true);
      setError(null);
      clearAttachments();
      initialMessageCountRef.current = 0;
      setLoadingHistory(false);
      return;
    }

    const pendingKey = `pending-stream-${chatId}`;
    const pendingData = sessionStorage.getItem(pendingKey);
    if (pendingData) {
      sessionStorage.removeItem(pendingKey);
      isNewChatCreatedRef.current = false;
      try {
        const { promptMessage, promptImages, promptPDFs, modelId } = JSON.parse(pendingData);
        const activeModelId = MODELS_REGISTRY.some(model => model.id === modelId) ? modelId : 'sonar';
        setSelectedModelId(activeModelId);
        db.messages.where('chatId').equals(chatId).sortBy('createdAt').then(stored => {
          setLoadingHistory(false);
          const user = stored[0];
          const assistant = stored[1];
          if (user?.id === undefined || assistant?.id === undefined) return;
          setMessages([{
            id: user.id, role: user.role, content: user.content, images: user.images, pdfs: user.pdfs,
          }]);
          setStreamingMessage({ id: assistant.id, role: assistant.role, content: '' });
          setIsInitialView(false);
          initialMessageCountRef.current = 2;
          void runStreaming(chatId, activeModelId, [], {
            id: user.id, role: 'user', content: promptMessage, images: promptImages, pdfs: promptPDFs,
          }, assistant.id);
        }).catch(error => {
          console.error('Error fetching initial messages:', error);
          setLoadingHistory(false);
        });
        return;
      } catch (error) {
        console.error('Failed to parse pending stream data:', error);
        setLoadingHistory(false);
      }
    }
    if (isNewChatCreatedRef.current) {
      isNewChatCreatedRef.current = false;
      setLoadingHistory(false);
      return;
    }
    if (isLoadingRef.current) return;

    db.chats.get(chatId).then(chat => {
      if (chat) {
        setSelectedModelId(MODELS_REGISTRY.some(model => model.id === chat.modelMode) ? chat.modelMode : 'sonar');
      }
    });
    db.messages.where('chatId').equals(chatId).reverse().limit(loadedLimit).toArray().then(stored => {
      const ordered = stored.reverse();
      initialMessageCountRef.current = ordered.length;
      if (isLoadingHistoryRef.current && messages.length > 0) {
        const firstId = messages[0].id ?? 0;
        const container = scrollContainerRef.current;
        const anchor = container?.querySelector(`#msg-${firstId}`);
        if (container && anchor) {
          scrollAnchorRef.current = {
            id: firstId,
            relativeTop: anchor.getBoundingClientRect().top - container.getBoundingClientRect().top,
          };
        }
      }
      setMessages(ordered.map(message => ({
        id: message.id, role: message.role, content: message.content,
        images: message.images, pdfs: message.pdfs,
      })));
      setStreamingMessage(null);
      setIsInitialView(false);
      setLoadingHistory(false);
    });
  }, [chatId, loadedLimit, handleStop]);

  useEffect(() => {
    if (messages.length + (streamingMessage ? 1 : 0) === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, Boolean(streamingMessage), messagesEndRef]);

  return {
    isLoadingHistory,
    sentinelRef,
    conversationRef,
    initialMessageCountRef,
    isNewChatCreatedRef,
  };
}
