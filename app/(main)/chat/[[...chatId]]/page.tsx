"use client";

import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { ArrowUp, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import dynamic from 'next/dynamic';
import { streamChatContent } from '@/lib/chat-client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSidebarContext } from '@/components/chat/SidebarContext';
import { db } from '@/lib/db';
import { createChatSession, addMessageToSession, updateMessageContentById, branchOffChat } from '@/hooks/use-chat-history';
import { useParams, useRouter } from 'next/navigation';
import { MODELS_REGISTRY, type ModelConfig } from '@/lib/models';
import Link from 'next/link';
import { useApiKeys } from '@/hooks/use-api-keys';
import { ChatHeader } from '@/components/chat/ChatHeader';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from 'next-themes';
import { TableWrapper } from '@/components/chat/TableWrapper';
import { processThinkingContent } from '@/utils/chat';
import { ChatInput } from '@/components/chat/ChatInput';


import { pruneChatHistory } from '@/utils/chat-context';
import { MessageAnimator } from '@/components/chat/MessageAnimator';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomToast } from '@/components/ui/custom-toast';
import { useVisualViewport } from '@/hooks/use-visual-viewport';
import { Spinner } from '@/components/ui/Spinner';

const SettingsPageContent = dynamic(
  () => import('@/components/chat/SettingsPageContent').then(mod => mod.SettingsPageContent),
  { ssr: false }
);

const SearchPageContent = dynamic(
  () => import('@/components/chat/SearchPageContent').then(mod => mod.SearchPageContent),
  { ssr: false }
);

const MessageComponent = dynamic(
  () => import('@/components/chat/Message').then(mod => mod.Message),
  { ssr: false }
);

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  pdfs?: { name: string; data: string }[];
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useCustomToast();

  // Parse dynamic chatId from optional catch-all parameter list
  const chatIdParam = useMemo(() => {
    if (!params?.chatId) return null;
    return Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;
  }, [params?.chatId]);



  const {
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSearchActive,
    setIsSearchActive,
    isSettingsActive,
    setIsSettingsActive,
  } = useSidebarContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);



  const { keys: apiKeys, updateKey } = useApiKeys();
  const [loadedLimit, setLoadedLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const isLoadingHistoryRef = useRef(false);
  const setIsLoadingHistoryState = (val: boolean) => {
    setIsLoadingHistory(val);
    isLoadingHistoryRef.current = val;
  };
  const hasScrolledToBottomRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [researchEnabled, setResearchEnabled] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);

  // Refs to latest search/research flags so runStreaming doesn't need them as deps
  const searchEnabledRef = useRef(false);
  const researchEnabledRef = useRef(false);
  const { bottomOffset: keyboardOffset } = useVisualViewport();

  const handleToggleSearch = (enabled: boolean) => {
    setSearchEnabled(enabled);
    searchEnabledRef.current = enabled;
    localStorage.setItem('search-enabled', enabled ? 'true' : 'false');
    if (enabled) {
      setResearchEnabled(false);
      researchEnabledRef.current = false;
      localStorage.setItem('research-enabled', 'false');
    }
  };

  const handleToggleResearch = (enabled: boolean) => {
    setResearchEnabled(enabled);
    researchEnabledRef.current = enabled;
    localStorage.setItem('research-enabled', enabled ? 'true' : 'false');
    if (enabled) {
      setSearchEnabled(false);
      searchEnabledRef.current = false;
      localStorage.setItem('search-enabled', 'false');
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const conversationRef = useRef<Message[]>([]);
  conversationRef.current = messages;

  const displayMessages = streamingMessage
    ? [...messages.filter(m => m.id !== streamingMessage.id), streamingMessage]
    : messages;

  const scrollHeightRef = useRef<number | null>(null);
  const scrollTopRef = useRef<number | null>(null);
  const scrollAnchorRef = useRef<{ id: number | string; relativeTop: number } | null>(null);

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedPDFs, setSelectedPDFs] = useState<{ name: string; data: string }[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('sonar');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Ref to bypass database loading during active new session creation
  const isNewChatCreatedRef = useRef(false);
  const isInitialScrollSnapRef = useRef(false);
  const isUserScrolledUpRef = useRef(false);
  // Mirror of isLoading as a ref so ResizeObserver can read it without dep-array re-registration
  const isLoadingRef = useRef(false);
  const initialMessageCountRef = useRef(0);

  // Ref to latest apiKeys so runStreaming / triggerTitleGeneration don't
  // need apiKeys in their useCallback deps (apiKeys object changes every render)
  const apiKeysRef = useRef(apiKeys);
  useEffect(() => { apiKeysRef.current = apiKeys; }, [apiKeys]);

  // Keep isLoadingRef in sync with isLoading so closures always have latest value without causing re-renders
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const [isInitialView, setIsInitialView] = useState(true);
  const { setTheme, theme } = useTheme();
  const [expandedThinking, setExpandedThinking] = useState<number[]>([]);
  const [processingPDF, setProcessingPDF] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const showScrollButtonRef = useRef(false);

  useEffect(() => {
    const search = localStorage.getItem('search-enabled') === 'true';
    const research = localStorage.getItem('research-enabled') === 'true';
    setSearchEnabled(search);
    setResearchEnabled(research);
    searchEnabledRef.current = search;
    researchEnabledRef.current = research;
  }, []);

  // Reset limit on session change
  useEffect(() => {
    setLoadedLimit(20);
    setIsLoadingHistoryState(false);
    showScrollButtonRef.current = false;
    setShowScrollButton(false);
    isInitialScrollSnapRef.current = true;
    const timer = setTimeout(() => {
      isInitialScrollSnapRef.current = false;
    }, 800);
    return () => clearTimeout(timer);
  }, [chatIdParam]);

  // Check if there are more messages in the database
  useEffect(() => {
    if (chatIdParam) {
      db.messages
        .where('chatId')
        .equals(chatIdParam)
        .count()
        .then(count => {
          setHasMore(count > (messages.length + (streamingMessage ? 1 : 0)));
        });
    }
  }, [chatIdParam, messages.length, streamingMessage]);

  // Infinite Scroll IntersectionObserver for loading older messages
  useEffect(() => {
    if (isInitialView || messages.length === 0 || !hasMore || isLoadingHistory) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const currentMsgs = conversationRef.current;
          if (currentMsgs && currentMsgs.length > 0) {
            const firstMsg = currentMsgs[0];
            const firstMsgId = firstMsg.id ?? 0;
            const scrollContainer = scrollContainerRef.current;
            if (scrollContainer) {
              const anchorEl = scrollContainer.querySelector(`#msg-${firstMsgId}`);
              if (anchorEl) {
                const containerRect = scrollContainer.getBoundingClientRect();
                const anchorRect = anchorEl.getBoundingClientRect();
                scrollAnchorRef.current = {
                  id: firstMsgId,
                  relativeTop: anchorRect.top - containerRect.top
                };
              }
            }
          }
          setIsLoadingHistoryState(true);
          setLoadedLimit(prev => prev + 20);
        }
      },
      { threshold: 0.1 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }
    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [messages.length, isInitialView, hasMore, isLoadingHistory]);

  // Sync scroll height correction before repaint when new history items are loaded
  useLayoutEffect(() => {
    if (scrollAnchorRef.current !== null) {
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        const anchorEl = scrollContainer.querySelector(`#msg-${scrollAnchorRef.current.id}`);
        if (anchorEl) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const anchorRect = anchorEl.getBoundingClientRect();
          const newRelativeTop = anchorRect.top - containerRect.top;
          const diff = newRelativeTop - scrollAnchorRef.current.relativeTop;
          scrollContainer.scrollTop += diff;
        }
      }
      scrollAnchorRef.current = null;
    }
  }, [messages.length, isLoadingHistory]);

  // Hydrate chat message and configuration settings when chatIdParam or loadedLimit changes
  useEffect(() => {
    if (chatIdParam) {
      // 1. Check for pending stream first
      const pendingStreamKey = `pending-stream-${chatIdParam}`;
      const pendingStreamData = sessionStorage.getItem(pendingStreamKey);

      if (pendingStreamData) {
        sessionStorage.removeItem(pendingStreamKey);
        isNewChatCreatedRef.current = false;
        try {
          const { promptMessage, promptImages, promptPDFs, modelId } = JSON.parse(pendingStreamData);

          // Restore config state
          const isValidModel = MODELS_REGISTRY.some(m => m.id === modelId);
          const activeModelId = isValidModel ? modelId : 'sonar';
          setSelectedModelId(activeModelId);

          db.messages
            .where('chatId')
            .equals(chatIdParam)
            .sortBy('createdAt')
            .then(msgs => {
              if (msgs.length >= 2) {
                const userMsgWithId = msgs[0];
                const assistantMsgWithId = msgs[1];
                if (userMsgWithId.id !== undefined && assistantMsgWithId.id !== undefined) {
                  setMessages([
                    {
                      id: userMsgWithId.id,
                      role: userMsgWithId.role,
                      content: userMsgWithId.content,
                      images: userMsgWithId.images,
                      pdfs: userMsgWithId.pdfs
                    }
                  ]);
                  setStreamingMessage({
                    id: assistantMsgWithId.id,
                    role: assistantMsgWithId.role,
                    content: ''
                  });
                  setIsInitialView(false);
                  initialMessageCountRef.current = 2;

                  const userMsg: Message = {
                    id: userMsgWithId.id,
                    role: 'user',
                    content: promptMessage,
                    images: promptImages,
                    pdfs: promptPDFs
                  };

                  runStreaming(chatIdParam, activeModelId, [], userMsg, assistantMsgWithId.id);
                }
              }
            });
          return;
        } catch (e) {
          console.error('Failed to parse pending stream data:', e);
        }
      }

      // If we just submitted a message on a new chat, bypass DB loading to avoid wiping stream state
      if (isNewChatCreatedRef.current) {
        isNewChatCreatedRef.current = false;
        return;
      }

      db.chats.get(chatIdParam).then(chat => {
        if (chat) {
          const isValidModel = MODELS_REGISTRY.some(m => m.id === chat.modelMode);
          setSelectedModelId(isValidModel ? chat.modelMode : 'sonar');
        }
      });

      db.messages
        .where('chatId')
        .equals(chatIdParam)
        .reverse()
        .limit(loadedLimit)
        .toArray()
        .then(msgs => {
          const orderedMsgs = msgs.reverse();
          initialMessageCountRef.current = orderedMsgs.length;
          
          if (isLoadingHistoryRef.current && messages.length > 0) {
            const firstMsg = messages[0];
            const firstMsgId = firstMsg.id ?? 0;
            const scrollContainer = scrollContainerRef.current;
            if (scrollContainer) {
              const anchorEl = scrollContainer.querySelector(`#msg-${firstMsgId}`);
              if (anchorEl) {
                const containerRect = scrollContainer.getBoundingClientRect();
                const anchorRect = anchorEl.getBoundingClientRect();
                scrollAnchorRef.current = {
                  id: firstMsgId,
                  relativeTop: anchorRect.top - containerRect.top
                };
              }
            }
          }

          setMessages(orderedMsgs.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            images: m.images,
            pdfs: m.pdfs
          })));
          setStreamingMessage(null);
          setIsInitialView(false);
          setIsLoadingHistoryState(false);
        });
    } else {
      handleStop();
      setMessages([]);
      setStreamingMessage(null);
      setIsInitialView(true);
      setError(null);
      setSelectedImages([]);
      setSelectedPDFs([]);
      initialMessageCountRef.current = 0;
      setIsLoadingHistoryState(false);
    }
  }, [chatIdParam, loadedLimit, handleStop]);

  useEffect(() => {
    const totalCount = messages.length + (streamingMessage ? 1 : 0);
    if (totalCount === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // Only run on length change, not on content changes (avoids firing on every token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, !!streamingMessage]);

  useEffect(() => {
    const totalCount = messages.length + (streamingMessage ? 1 : 0);
    if (totalCount > 0 && isInitialView) {
      setIsInitialView(false);
    }
    // Only run on length change, not on content changes (avoids firing on every token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, !!streamingMessage, isInitialView]);

  const handleNewChat = () => {
    handleStop();
    setIsSearchActive(false);
    setIsSettingsActive(false);
    router.push('/chat');
    setMessages([]);
    setError(null);
    setIsInitialView(true);
    setSelectedImages([]);
    setSelectedPDFs([]);
    setSelectedModelId('sonar');
    initialMessageCountRef.current = 0;
  };

  const triggerTitleGeneration = useCallback(async (
    chatId: string,
    firstQuery: string,
    modelMode: string
  ) => {
    try {
      const keys = apiKeysRef.current;
      const response = await fetch('/api/chat/title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key-gemini': keys.geminiApiKey || localStorage.getItem('gemini-api-key') || '',
          'x-api-key-mistral': keys.mistralApiKey || localStorage.getItem('mistral-api-key') || '',
          'x-api-key-perplexity': keys.perplexityApiKey || localStorage.getItem('perplexity-api-key') || '',
          'x-api-key-zenmux': keys.zenmuxApiKey || localStorage.getItem('zenmux-api-key') || '',
          'x-api-key-inception': keys.inceptionApiKey || localStorage.getItem('inception-api-key') || '',
          'x-api-key-nvidia': keys.nvidiaApiKey || localStorage.getItem('nvidia-api-key') || '',
        },
        body: JSON.stringify({
          firstQuery,
          modelMode,
        }),
      });

      if (response.ok) {
        const { title } = await response.json();
        if (title && title.trim()) {
          const cleanTitle = title.trim().replace(/^["']|["']$/g, '');
          await db.chats.update(chatId, { title: cleanTitle });
        }
      }
    } catch (err) {
      console.error('Failed to auto-generate chat title:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main streaming runner helper callback
  const runStreaming = useCallback(async (
    chatId: string,
    modelId: string,
    history: Message[],
    userMsg: Message,
    assistantMessageId: number
  ) => {
    // Read from refs so the callback stays stable and doesn't re-create on every render
    const keys = {
      geminiApiKey: apiKeysRef.current.geminiApiKey || localStorage.getItem('gemini-api-key'),
      mistralApiKey: apiKeysRef.current.mistralApiKey || localStorage.getItem('mistral-api-key'),
      perplexityApiKey: apiKeysRef.current.perplexityApiKey || localStorage.getItem('perplexity-api-key'),
      zenmuxApiKey: apiKeysRef.current.zenmuxApiKey || localStorage.getItem('zenmux-api-key'),
      nvidiaApiKey: apiKeysRef.current.nvidiaApiKey || localStorage.getItem('nvidia-api-key'),
      inceptionApiKey: apiKeysRef.current.inceptionApiKey || localStorage.getItem('inception-api-key'),
      tavilyApiKey: apiKeysRef.current.tavilyApiKey || localStorage.getItem('tavily-api-key'),
      exaApiKey: apiKeysRef.current.exaApiKey || localStorage.getItem('exa-api-key'),
      firecrawlApiKey: apiKeysRef.current.firecrawlApiKey || localStorage.getItem('firecrawl-api-key'),
    };

    const isSearch = searchEnabledRef.current || localStorage.getItem('search-enabled') === 'true';
    const isResearch = researchEnabledRef.current || localStorage.getItem('research-enabled') === 'true';

    const activeModel = MODELS_REGISTRY.find(m => m.id === modelId) || MODELS_REGISTRY[0];
    const key = activeModel.provider === 'google'
      ? keys.geminiApiKey
      : activeModel.provider === 'mistral'
        ? keys.mistralApiKey
        : activeModel.provider === 'perplexity'
          ? keys.perplexityApiKey
          : activeModel.provider === 'nvidia'
            ? keys.nvidiaApiKey
            : activeModel.provider === 'inception'
              ? keys.inceptionApiKey
              : keys.zenmuxApiKey;

    if (!key) {
      setError(`Please set your API key in the settings to use ${activeModel.name}`);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);
    setError(null);

    let accumulatedContent = '';
    let visibilityChangeHandler: (() => void) | null = null;

    try {
      const historyPruned = pruneChatHistory(history, 20, 4);
      const payload = [
        ...historyPruned,
        {
          role: userMsg.role,
          content: userMsg.content,
          images: userMsg.images,
          pdfs: userMsg.pdfs
        }
      ];

      let thinkingStartTime = Date.now();
      let thinkingDuration = 0;
      let researchStartTime = Date.now();
      let researchDuration = 0;
      let lastSavedTime = Date.now();

      // RAF-throttled flush: instead of calling setConversation on every token byte,
      // we accumulate into accumulatedContent and flush to React state via rAF.
      // This caps re-renders to ~60fps regardless of token rate, eliminating the
      // "Maximum update depth exceeded" cascade that killed deep research on mobile/desktop.
      //
      // Fallback: if the tab is backgrounded (RAF stops firing on mobile), a
      // 250ms setTimeout ensures the flush still happens when the tab is visible
      // again, and a visibilitychange listener force-flushes immediately on resume.
      let flushRafId: number | null = null;
      let flushTimerId: ReturnType<typeof setTimeout> | null = null;
      let pendingFlush = false;

      const doFlush = () => {
        flushRafId = null;
        flushTimerId = null;
        if (!pendingFlush) return;
        pendingFlush = false;
        const content = accumulatedContent;
        setStreamingMessage(prev => {
          if (!prev) return { id: assistantMessageId, role: 'assistant', content };
          if (prev.content === content) return prev;
          return { ...prev, content };
        });
      };

      const scheduleFlush = () => {
        if (flushRafId !== null || flushTimerId !== null) return; // already scheduled
        flushRafId = requestAnimationFrame(() => {
          flushRafId = null;
          if (flushTimerId !== null) { clearTimeout(flushTimerId); flushTimerId = null; }
          doFlush();
        });
        // Fallback timer: fires if rAF is throttled (background tab on mobile)
        flushTimerId = setTimeout(() => {
          flushTimerId = null;
          if (flushRafId !== null) { cancelAnimationFrame(flushRafId); flushRafId = null; }
          doFlush();
        }, 250);
      };

      // When the user returns to the tab after backgrounding, immediately flush
      // whatever accumulated while rAF was throttled.
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && pendingFlush) {
          if (flushRafId !== null) { cancelAnimationFrame(flushRafId); flushRafId = null; }
          if (flushTimerId !== null) { clearTimeout(flushTimerId); flushTimerId = null; }
          doFlush();
        }
      };
      visibilityChangeHandler = handleVisibilityChange;
      document.addEventListener('visibilitychange', handleVisibilityChange);

      await streamChatContent(
        payload,
        modelId,
        keys,
        isSearch,
        isResearch,
        (token) => {
          accumulatedContent += token;

          if (accumulatedContent.includes('</think>') && thinkingDuration === 0) {
            thinkingDuration = (Date.now() - thinkingStartTime) / 1000;
          }

          // Schedule a throttled state flush instead of calling setState directly
          pendingFlush = true;
          scheduleFlush();

          // Periodically save to IndexedDB to prevent data loss on connection drop or page refresh
          const now = Date.now();
          if (now - lastSavedTime > 1500) {
            lastSavedTime = now;
            updateMessageContentById(assistantMessageId, accumulatedContent).catch(err => {
              console.warn('[IndexedDB Save] Failed to update intermediate content:', err);
            });
          }
        },
        controller.signal
      );

      // Cancel any pending rAF/timer flush and do a final synchronous state update
      if (visibilityChangeHandler) { document.removeEventListener('visibilitychange', visibilityChangeHandler); visibilityChangeHandler = null; }
      if (flushRafId !== null) { cancelAnimationFrame(flushRafId); flushRafId = null; }
      if (flushTimerId !== null) { clearTimeout(flushTimerId); flushTimerId = null; }

      // Save the completed response to IndexedDB
      let finalContent = accumulatedContent;
      if (thinkingDuration > 0 && accumulatedContent.includes('</think>')) {
        finalContent = accumulatedContent.replace('</think>', `</think><thinkingTime>${thinkingDuration.toFixed(1)}</thinkingTime>`);
      }
      if (isResearch) {
        researchDuration = (Date.now() - researchStartTime) / 1000;
        finalContent += `<researchTime>${researchDuration.toFixed(1)}</researchTime>`;
      }

      await updateMessageContentById(assistantMessageId, finalContent);

      // Append completed message to messages state and clear streamingMessage
      const finalAssistantMsg: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: finalContent
      };
      setMessages(prev => [...prev, finalAssistantMsg]);
      setStreamingMessage(null);

      // Defer title generation to run AFTER the assistant finishes response generation successfully
      if (history.length === 0) {
        triggerTitleGeneration(chatId, userMsg.content, modelId);
      }

    } catch (error: any) {
      if (error?.message === 'Aborted' || error?.name === 'AbortError') {
        console.log('Stream stopped by user');
        return;
      }
      console.error('Error generating response:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to generate response. Please try again.';
      setError(errMsg);

      if (accumulatedContent.trim()) {
        const errorSuffix = `\n\n⚠️ Connection Error: ${errMsg}`;
        accumulatedContent += errorSuffix;

        const finalAssistantMsg: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: accumulatedContent
        };
        setMessages(prev => [...prev, finalAssistantMsg]);
        setStreamingMessage(null);

        await updateMessageContentById(assistantMessageId, accumulatedContent);
      } else {
        // If no content was accumulated, clean up the assistant placeholder
        setStreamingMessage(null);
        await db.messages.delete(assistantMessageId);
      }
    } finally {
      setIsLoading(false);
      if (visibilityChangeHandler) { document.removeEventListener('visibilitychange', visibilityChangeHandler); visibilityChangeHandler = null; }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [triggerTitleGeneration]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type === 'application/pdf') {
        const activeModel = MODELS_REGISTRY.find(m => m.id === selectedModelId);
        if (activeModel?.id === 'mistral-small-latest' || activeModel?.id === 'codestral-latest') {
          setError('PDF uploads are not supported in light response models');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit for PDFs
          setError('PDF size should be less than 10MB');
          continue;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (result) {
            setSelectedPDFs(prev => [...prev, {
              name: file.name,
              data: result as string
            }]);
          }
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('image/')) {
        if (file.size > 20 * 1024 * 1024) { // 20MB limit for images
          setError('Image size should be less than 20MB');
          continue;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setSelectedImages(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removePDF = (index: number) => {
    setSelectedPDFs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (text: string) => {
    if ((!text.trim() && selectedImages.length === 0 && selectedPDFs.length === 0) || (!apiKeys.geminiApiKey && !apiKeys.mistralApiKey && !apiKeys.perplexityApiKey && !apiKeys.zenmuxApiKey && !apiKeys.nvidiaApiKey && !apiKeys.inceptionApiKey)) return;

    let chatId = chatIdParam;
    const isNewChat = !chatId || (messages.length === 0 && !streamingMessage);

    // Capture inputs synchronously to bypass database write latency in UI clearing
    const promptMessage = text;
    const promptImages = selectedImages.length > 0 ? [...selectedImages] : undefined;
    const promptPDFs = selectedPDFs.length > 0 ? [...selectedPDFs] : undefined;

    // Instantly empty client input states for a fluid iMessage-style response
    setSelectedImages([]);
    setSelectedPDFs([]);
    setError(null);

    if (isNewChat) {
      const title = promptMessage.trim().substring(0, 30) || 'New Chat';
      const newChatId = await createChatSession(selectedModelId, title);
      isNewChatCreatedRef.current = true;

      // Save user and empty assistant messages to IndexedDB
      await addMessageToSession(newChatId, 'user', promptMessage, promptImages, promptPDFs);
      await addMessageToSession(newChatId, 'assistant', '');

      // Buffer the stream inputs in sessionStorage so the newly mounted component picks it up
      sessionStorage.setItem(`pending-stream-${newChatId}`, JSON.stringify({
        promptMessage,
        promptImages,
        promptPDFs,
        modelId: selectedModelId
      }));

      // Trigger Next.js route transition
      router.push(`/chat/${newChatId}`);
    } else {
      // Existing chat - no page re-mount will occur
      setIsLoading(true);

      // Save user message to IndexedDB
      const userMessageId = await addMessageToSession(chatId!, 'user', promptMessage, promptImages, promptPDFs);

      // Add user message to messages list
      setMessages(prev => [...prev, {
        id: userMessageId,
        role: 'user',
        content: promptMessage,
        images: promptImages,
        pdfs: promptPDFs
      }]);

      // Save assistant placeholder message to IndexedDB
      const assistantMessageId = await addMessageToSession(chatId!, 'assistant', '');

      // Set active streaming message
      setStreamingMessage({ id: assistantMessageId, role: 'assistant', content: '' });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);

      const userMsg: Message = {
        id: userMessageId,
        role: 'user',
        content: promptMessage,
        images: promptImages,
        pdfs: promptPDFs
      };

      // Call streaming helper with current completed messages as history
      await runStreaming(chatId!, selectedModelId, messages, userMsg, assistantMessageId);
    }
  };

  // Branch off a conversation at a given assistant message index
  const handleBranchOff = useCallback(async (messageIndex: number) => {
    if (!chatIdParam) return;

    try {
      const newChatId = await branchOffChat(chatIdParam, messageIndex, selectedModelId);

      // Find the first user message from the branched conversation for title generation
      const firstUserMsg = conversationRef.current.find(m => m.role === 'user');
      if (firstUserMsg) {
        triggerTitleGeneration(newChatId, firstUserMsg.content, selectedModelId);
      }

      showToast({
        title: 'Conversation branched',
        message: 'New chat created preserving history up to this point.',
        type: 'success',
      });

      router.push(`/chat/${newChatId}`);
    } catch (err) {
      console.error('Failed to branch off chat:', err);
      showToast({
        title: 'Failed to branch',
        message: 'There was a problem branching this conversation.',
        type: 'error',
      });
    }
  }, [chatIdParam, selectedModelId, triggerTitleGeneration, router, showToast]);

  // Handle scroll button visibility and manual scroll tracking
  // NOTE: deliberately NOT in conversation deps — that caused setState loop on every token
  useEffect(() => {
    if (isInitialView) return;

    // Use a ref to store pending showScrollButton value and flush it via rAF
    // This prevents setShowScrollButton from firing synchronously during ResizeObserver
    // callbacks (which happen during streaming), which was causing the render loop.
    let rafId: number | null = null;
    let pendingValue: boolean | null = null;

    const flushScrollButton = () => {
      rafId = null;
      if (pendingValue !== null) {
        setShowScrollButton(pendingValue);
        pendingValue = null;
      }
    };

    const handleScroll = () => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;
      const scrollPosition = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const containerHeight = scrollContainer.clientHeight;

      const threshold = 200;
      const isNearBottom = scrollHeight - (scrollPosition + containerHeight) <= threshold;
      const next = !isNearBottom && scrollHeight > containerHeight + threshold;

      // Gate state updates using showScrollButtonRef to prevent render cascades
      if (next !== showScrollButtonRef.current) {
        showScrollButtonRef.current = next;
        pendingValue = next;
        if (rafId === null) {
          rafId = requestAnimationFrame(flushScrollButton);
        }
      }

      // Track whether user has manually scrolled up away from the bottom (ref only, no setState)
      isUserScrolledUpRef.current = scrollHeight - (scrollPosition + containerHeight) > 100;
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      handleScroll();
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        if (rafId !== null) cancelAnimationFrame(rafId);
      };
    }
  }, [isInitialView]);

  // ResizeObserver: auto-scroll to bottom during active streaming/deep research.
  // Registered once per chat session — reads isLoadingRef so no re-registration is needed.
  useEffect(() => {
    if (!chatIdParam || isInitialView) return;

    const scrollContainer = scrollContainerRef.current;
    const contentEl = contentRef.current;
    if (!scrollContainer || !contentEl) return;

    // Snap to bottom on initial chat load
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
    isUserScrolledUpRef.current = false;

    const observer = new ResizeObserver(() => {
      if (isInitialScrollSnapRef.current) {
        // During initial page mount – always snap
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      } else if (isLoadingRef.current && !isUserScrolledUpRef.current) {
        // During active streaming/deep research and user hasn't scrolled up
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    });

    observer.observe(contentEl);
    return () => {
      observer.disconnect();
    };
  }, [chatIdParam, isInitialView]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <ChatHeader
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        activeChatId={chatIdParam}
        onSelectChat={(id) => {
          setIsSearchActive(false);
          setIsSettingsActive(false);
          router.push(`/chat/${id}`);
        }}
        onNewChat={handleNewChat}
        isLibraryPageActive={false}
        setIsLibraryPageActive={() => {
          router.push('/library');
        }}
        selectedModelId={selectedModelId}
        setSelectedModelId={setSelectedModelId}
        isLoading={isLoading}
        apiKeys={apiKeys}
        mounted={mounted}
      />

      {/* Main Content */}
      <div 
        ref={scrollContainerRef}
        className={cn(
          "flex-1 w-full transition-[padding-left] duration-300 ease-in-out h-full min-h-0",
          isSearchActive
            ? "flex flex-col h-[calc(100vh-80px)] overflow-hidden pt-20"
            : isInitialView
              ? cn(
                  "flex flex-col items-center overflow-y-auto chat-scrollbar",
                  keyboardOffset > 0
                    ? "justify-start pt-16 mt-0"
                    : "justify-center -mt-16 sm:-mt-24"
                )
              : "overflow-y-auto chat-scrollbar pt-16 sm:pt-20 pb-24 sm:pb-32"
        )}
      >
        <div className={cn(
          "w-full mx-auto px-2 sm:px-4 relative",
          isSearchActive ? "max-w-4xl h-full overflow-hidden" : "max-w-4xl"
        )}>
          {isSearchActive ? (
            <SearchPageContent
              onSelectChat={(id) => {
                setIsSearchActive(false);
                setIsSettingsActive(false);
                router.push(`/chat/${id}`);
              }}
            />
          ) : (
            <>
              {/* Settings Page Slide-Over */}
              <AnimatePresence>
                {isSettingsActive && (
                  <motion.div
                    key="settings-panel"
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 240 }}
                    className={cn(
                      "fixed top-16 sm:top-20 bottom-0 right-0 bg-background z-20 flex flex-col overflow-hidden transition-[left] duration-300",
                      isSidebarCollapsed ? "left-0" : "left-0 md:left-64"
                    )}
                  >
                    <SettingsPageContent
                      apiKeys={apiKeys}
                      updateKey={updateKey}
                      onClose={() => setIsSettingsActive(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {isInitialView ? (
            <div className="flex flex-col items-center gap-8 sm:gap-10 px-4 sm:px-0">
              <div className="text-center animate-fade-in-up [animation-delay:200ms] flex flex-col items-center gap-4 sm:gap-5">
                <img
                  src="/chaticons/logo_chat.png"
                  alt="Paradox Logo"
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                />
                <p className="text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
                  What doesn't make sense yet?
                </p>
              </div>

              {!isSettingsActive && (
                <motion.div
                  layoutId="chat-input-container"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    y: { type: "spring", stiffness: 350, damping: 32, delay: 0.4 },
                    opacity: { duration: 0.35, delay: 0.4 },
                    layout: { type: "spring", stiffness: 350, damping: 32 }
                  }}
                  className={cn(
                    "w-full max-w-2xl mx-auto",
                    "fixed bottom-6 left-0 right-0 z-20 px-6 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:px-0"
                  )}
                  style={
                    keyboardOffset > 0
                      ? { bottom: `${keyboardOffset + 8}px` }
                      : undefined
                  }
                >
                  <ChatInput
                    handleSubmit={handleSubmit}
                    onStop={handleStop}
                    isLoading={isLoading}
                    geminiApiKey={apiKeys.geminiApiKey}
                    mistralApiKey={apiKeys.mistralApiKey}
                    perplexityApiKey={apiKeys.perplexityApiKey}
                    zenmuxApiKey={apiKeys.zenmuxApiKey}
                    nvidiaApiKey={apiKeys.nvidiaApiKey}
                    inceptionApiKey={apiKeys.inceptionApiKey}
                    selectedModelId={selectedModelId}
                    onSelectModel={setSelectedModelId}
                    handleFileUpload={handleFileUpload}
                    selectedImages={selectedImages}
                    removeImage={removeImage}
                    selectedPDFs={selectedPDFs}
                    removePDF={removePDF}
                    error={error}
                    isInitialView={true}
                    shouldFocus={true}
                    searchEnabled={searchEnabled}
                    onToggleSearch={handleToggleSearch}
                    researchEnabled={researchEnabled}
                    onToggleResearch={handleToggleResearch}
                    onExpandedChange={setIsInputExpanded}
                  />
                </motion.div>
              )}
            </div>
          ) : (
            <div ref={contentRef} className="space-y-6 pb-64 sm:pb-72">
               {isLoadingHistory && (
                 <div className="w-full flex justify-center py-2" id="history-loading-spinner">
                   <Spinner />
                 </div>
               )}
               <div ref={sentinelRef} className="h-4 w-full" />
               {displayMessages.map((msg: Message, index: number) => {
                 const isStreamItem = index === displayMessages.length - 1 && !!streamingMessage;
                 return (
                   <div key={msg.id ?? `msg-${index}`} id={`msg-${msg.id ?? index}`} className="group">
                     <MessageAnimator
                       role={msg.role}
                       isNew={index >= initialMessageCountRef.current}
                     >
                       <MessageComponent
                          message={msg}
                          index={index}
                          isStreaming={isStreamItem}
                          expandedThinking={expandedThinking}
                          setExpandedThinking={setExpandedThinking}
                          modelMode={selectedModelId}
                          onBranchOff={msg.role === 'assistant' && chatIdParam && !isStreamItem ? handleBranchOff : undefined}
                        />
                     </MessageAnimator>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} className="h-px" />
             </div>
          )}
          </>
          )}
        </div>
      </div>

      {/* Bottom Progressive Blur Overlay */}
      {!isInitialView && !isSearchActive && !isSettingsActive && (
        <div
          className={cn(
            "fixed bottom-0 right-0 z-10 h-32 sm:h-40 pointer-events-none progressive-blur",
            mounted && "transition-[left,bottom] duration-300",
            isSidebarCollapsed ? "left-0" : "left-0 md:left-64"
          )}
          style={
            keyboardOffset > 0
              ? { bottom: `${keyboardOffset}px` }
              : undefined
          }
        />
      )}

      {/* Input Area - Only show when not in initial view and search is not active */}
      {!isInitialView && !isSearchActive && !isSettingsActive && (
        <motion.div
          layoutId="chat-input-container"
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
          className={cn(
            "fixed z-20 bottom-6 sm:bottom-12",
            mounted && "transition-[left,bottom] duration-300",
            "max-w-2xl right-0 mx-auto px-6 sm:px-4",
            isSidebarCollapsed ? "left-0" : "left-0 md:left-64",
          )}
          style={
            keyboardOffset > 0
              ? { bottom: `${keyboardOffset + 8}px` }
              : undefined
          }
        >
          <div className="absolute left-1/2 -translate-x-1/2 -top-11 z-20">
            <button
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
              className={cn(
                "h-9 w-9 rounded-full liquid-glass-dock flex items-center justify-center",
                "text-foreground/70 hover:text-foreground",
                "transform transition-all duration-300 ease-in-out",
                "active:scale-[0.93] active:duration-75",
                showScrollButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
              )}
            >
              <ArrowUp className="h-4 w-4 rotate-180" />
            </button>
          </div>
          <ChatInput
            handleSubmit={handleSubmit}
            onStop={handleStop}
            isLoading={isLoading}
            geminiApiKey={apiKeys.geminiApiKey}
            mistralApiKey={apiKeys.mistralApiKey}
            perplexityApiKey={apiKeys.perplexityApiKey}
            zenmuxApiKey={apiKeys.zenmuxApiKey}
            nvidiaApiKey={apiKeys.nvidiaApiKey}
            inceptionApiKey={apiKeys.inceptionApiKey}
            selectedModelId={selectedModelId}
            onSelectModel={setSelectedModelId}
            handleFileUpload={handleFileUpload}
            selectedImages={selectedImages}
            removeImage={removeImage}
            selectedPDFs={selectedPDFs}
            removePDF={removePDF}
            error={error}
            isInitialView={false}
            shouldFocus={false}
            searchEnabled={searchEnabled}
            onToggleSearch={handleToggleSearch}
            researchEnabled={researchEnabled}
            onToggleResearch={handleToggleResearch}
            onExpandedChange={setIsInputExpanded}
          />
        </motion.div>
      )}

      {processingPDF && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Processing PDF...</span>
          </div>
        </div>
      )}
    </>
  );
}
