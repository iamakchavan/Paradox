"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { useSidebarContext } from '@/components/chat/SidebarContext';
import { useApiKeys } from '@/hooks/use-api-keys';
import { useVisualViewport } from '@/hooks/use-visual-viewport';
import { cn } from '@/lib/utils';
import { ActiveChatComposer, type ChatComposerControls } from './_components/chat-page-composer';
import { ChatPageContent } from './_components/chat-page-content';
import { useChatAttachments } from './_hooks/use-chat-attachments';
import { useChatActions } from './_hooks/use-chat-actions';
import { useChatHistoryState } from './_hooks/use-chat-history-state';
import { useChatIntegrations } from './_hooks/use-chat-integrations';
import { useChatModes } from './_hooks/use-chat-modes';
import { useChatScroll } from './_hooks/use-chat-scroll';
import { useChatStreaming } from './_hooks/use-chat-streaming';
import type { ChatMessage, OpenSettingsTab } from './_lib/types';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = useMemo(() => {
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
  const { keys: apiKeys } = useApiKeys();
  const { bottomOffset: keyboardOffset } = useVisualViewport();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<ChatMessage | null>(null);
  const [selectedModelId, setSelectedModelId] = useState('sonar');
  const [isInitialView, setIsInitialView] = useState(() => !chatId);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<number[]>([]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const {
    searchEnabled,
    researchEnabled,
    searchEnabledRef,
    researchEnabledRef,
    handleToggleSearch,
    handleToggleResearch,
  } = useChatModes();
  const {
    selectedMcpIds,
    selectedMcpIdsRef,
    handleToggleMcpId,
    persistForChat,
  } = useChatIntegrations(chatId);
  const {
    selectedImages,
    selectedPDFs,
    handleFileUpload,
    removeImage,
    removePDF,
    clearAttachments,
  } = useChatAttachments({ selectedModelId, setError });
  const {
    isLoading,
    isLoadingRef,
    setIsLoadingState,
    handleStop,
    runStreaming,
    triggerTitleGeneration,
  } = useChatStreaming({
    chatId,
    apiKeys,
    searchEnabledRef,
    researchEnabledRef,
    selectedMcpIdsRef,
    setMessages,
    setStreamingMessage,
    setError,
  });
  const {
    messagesEndRef,
    scrollContainerRef,
    contentRef,
    showScrollButton,
    scrollToBottom,
  } = useChatScroll({ chatId, isInitialView, isLoadingRef });
  const {
    isLoadingHistory,
    sentinelRef,
    conversationRef,
    initialMessageCountRef,
    isNewChatCreatedRef,
  } = useChatHistoryState({
    chatId,
    messages,
    streamingMessage,
    setMessages,
    setStreamingMessage,
    setSelectedModelId,
    setIsInitialView,
    setError,
    isLoading,
    isInitialView,
    isLoadingRef,
    handleStop,
    clearAttachments,
    runStreaming,
    scrollContainerRef,
    messagesEndRef,
  });

  const displayMessages = streamingMessage
    ? [
        ...messages.filter(message => (
          message.id === undefined || String(message.id) !== String(streamingMessage.id)
        )),
        streamingMessage,
      ]
    : messages;

  useEffect(() => {
    if (messages.length + (streamingMessage ? 1 : 0) > 0 && isInitialView) {
      setIsInitialView(false);
    }
  }, [messages.length, Boolean(streamingMessage), isInitialView]);

  const selectChat = useCallback((id: string) => {
    setIsSearchActive(false);
    setIsSettingsActive(false);
    router.push(`/chat/${id}`);
  }, [router, setIsSearchActive, setIsSettingsActive]);

  const closeSidebarSurfaces = useCallback(() => {
    setIsSearchActive(false);
    setIsSettingsActive(false);
  }, [setIsSearchActive, setIsSettingsActive]);

  const handleOpenSettingsTab = useCallback((tab: OpenSettingsTab) => {
    if (tab === 'integrations') {
      router.push('/apps');
      return;
    }
    setIsSettingsActive(true);
  }, [router, setIsSettingsActive]);

  const { handleNewChat, handleSubmit, handleBranchOff } = useChatActions({
    chatId,
    messages,
    streamingMessage,
    apiKeys,
    selectedModelId,
    setSelectedModelId,
    selectedImages,
    selectedPDFs,
    clearAttachments,
    persistIntegrationsForChat: persistForChat,
    setMessages,
    setStreamingMessage,
    setIsInitialView,
    setError,
    setIsLoading: setIsLoadingState,
    handleStop,
    runStreaming,
    triggerTitleGeneration,
    conversationRef,
    isNewChatCreatedRef,
    initialMessageCountRef,
    messagesEndRef,
    closeSidebarSurfaces,
  });

  const composerControls: ChatComposerControls = {
    handleSubmit,
    onStop: handleStop,
    isLoading,
    apiKeys,
    selectedModelId,
    onSelectModel: setSelectedModelId,
    handleFileUpload,
    selectedImages,
    removeImage,
    selectedPDFs,
    removePDF,
    error,
    searchEnabled,
    onToggleSearch: handleToggleSearch,
    researchEnabled,
    onToggleResearch: handleToggleResearch,
    onExpandedChange: setIsInputExpanded,
    onOpenSettingsTab: handleOpenSettingsTab,
    selectedMcpIds,
    onToggleMcpId: handleToggleMcpId,
  };

  return (
    <>
      <ChatHeader
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        activeChatId={chatId}
        onSelectChat={selectChat}
        onNewChat={handleNewChat}
        isLibraryPageActive={false}
        setIsLibraryPageActive={() => router.push('/library')}
        selectedModelId={selectedModelId}
        setSelectedModelId={setSelectedModelId}
        isLoading={isLoading}
        apiKeys={apiKeys}
        mounted={mounted}
      />
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex-1 w-full transition-[padding-left] duration-300 ease-in-out h-full min-h-0',
          isSearchActive
            ? 'flex flex-col h-[calc(100vh-80px)] overflow-hidden pt-20'
            : isInitialView
              ? cn(
                  'flex flex-col items-center overflow-y-auto chat-scrollbar',
                  keyboardOffset > 0 ? 'justify-start pt-16 mt-0' : 'justify-center -mt-16 sm:-mt-24',
                )
              : 'overflow-y-auto chat-scrollbar pt-16 sm:pt-20 pb-24 sm:pb-32',
        )}
      >
        <div className={cn(
          'w-full mx-auto px-2 sm:px-4 relative',
          isSearchActive ? 'max-w-4xl h-full overflow-hidden' : 'max-w-4xl',
        )}>
          <ChatPageContent
            isSearchActive={isSearchActive}
            isInitialView={isInitialView}
            isSettingsActive={isSettingsActive}
            onSelectChat={selectChat}
            composerControls={composerControls}
            isInputExpanded={isInputExpanded}
            keyboardOffset={keyboardOffset}
            contentRef={contentRef}
            sentinelRef={sentinelRef}
            messagesEndRef={messagesEndRef}
            isLoadingHistory={isLoadingHistory}
            displayMessages={displayMessages}
            streamingMessage={streamingMessage}
            initialMessageCount={initialMessageCountRef.current}
            expandedThinking={expandedThinking}
            setExpandedThinking={setExpandedThinking}
            selectedModelId={selectedModelId}
            chatId={chatId}
            onBranchOff={handleBranchOff}
          />
        </div>
      </div>
      {!isInitialView && !isSearchActive && !isSettingsActive && (
        <ActiveChatComposer
          controls={composerControls}
          expanded={isInputExpanded}
          keyboardOffset={keyboardOffset}
          sidebarCollapsed={isSidebarCollapsed}
          mounted={mounted}
          showScrollButton={showScrollButton}
          scrollToBottom={scrollToBottom}
        />
      )}
    </>
  );
}
