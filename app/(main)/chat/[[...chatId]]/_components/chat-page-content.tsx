"use client";

import dynamic from 'next/dynamic';
import type { Dispatch, Ref, SetStateAction } from 'react';
import { MessageAnimator } from '@/components/chat/MessageAnimator';
import { Spinner } from '@/components/ui/Spinner';
import type { ChatMessage } from '../_lib/types';
import { InitialChatComposer, type ChatComposerControls } from './chat-page-composer';

const SearchPageContent = dynamic(
  () => import('@/components/chat/SearchPageContent').then(module => module.SearchPageContent),
  { ssr: false },
);
const MessageComponent = dynamic(
  () => import('@/components/chat/Message').then(module => module.Message),
  { ssr: false },
);

interface Props {
  isSearchActive: boolean;
  isInitialView: boolean;
  isSettingsActive: boolean;
  onSelectChat: (id: string) => void;
  composerControls: ChatComposerControls;
  isInputExpanded: boolean;
  keyboardOffset: number;
  contentRef: Ref<HTMLDivElement>;
  sentinelRef: Ref<HTMLDivElement>;
  messagesEndRef: Ref<HTMLDivElement>;
  isLoadingHistory: boolean;
  displayMessages: ChatMessage[];
  streamingMessage: ChatMessage | null;
  initialMessageCount: number;
  expandedThinking: number[];
  setExpandedThinking: Dispatch<SetStateAction<number[]>>;
  selectedModelId: string;
  chatId: string | null;
  onBranchOff: (messageIndex: number) => void;
}

export function ChatPageContent(props: Props) {
  if (props.isSearchActive) {
    return <SearchPageContent onSelectChat={props.onSelectChat} />;
  }
  if (props.isInitialView) {
    return (
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
        {!props.isSettingsActive && (
          <InitialChatComposer
            controls={props.composerControls}
            expanded={props.isInputExpanded}
            keyboardOffset={props.keyboardOffset}
          />
        )}
      </div>
    );
  }
  return (
    <div ref={props.contentRef} className="space-y-6 pb-20 sm:pb-24">
      {props.isLoadingHistory && (
        <div className="w-full flex justify-center py-2" id="history-loading-spinner">
          <Spinner />
        </div>
      )}
      <div ref={props.sentinelRef} className="h-4 w-full" />
      {props.displayMessages.map((message, index) => {
        const streaming = index === props.displayMessages.length - 1 && Boolean(props.streamingMessage);
        return (
          <div key={message.id ?? `msg-${index}`} id={`msg-${message.id ?? index}`} className="group">
            <MessageAnimator role={message.role} isNew={index >= props.initialMessageCount}>
              <MessageComponent
                message={message}
                index={index}
                isStreaming={streaming}
                expandedThinking={props.expandedThinking}
                setExpandedThinking={props.setExpandedThinking}
                modelMode={props.selectedModelId}
                onBranchOff={message.role === 'assistant' && props.chatId && !streaming
                  ? props.onBranchOff
                  : undefined}
              />
            </MessageAnimator>
          </div>
        );
      })}
      <div ref={props.messagesEndRef} className="h-px" />
    </div>
  );
}
