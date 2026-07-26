"use client";

import { createContext, useContext } from 'react';

export interface MessageMarkdownContextValue {
  searchMap: Map<string, { title: string; content: string }> | null;
  isStreaming: boolean;
  messageContent: string;
  messageIndex: number;
}

export const MessageMarkdownContext = createContext<MessageMarkdownContextValue | null>(null);

export function useMessageMarkdownContext() {
  return useContext(MessageMarkdownContext);
}

