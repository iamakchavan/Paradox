"use client";

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatSession } from '@/lib/db';
import type { SidebarHistoryController } from './use-sidebar-history';
import { SidebarChatRow } from './SidebarChatRow';

interface SidebarHistoryProps {
  activeChatId: string | null;
  history: SidebarHistoryController;
  onSelectChat: (chatId: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onDeleteChat: (id: string) => void;
}

export function SidebarHistory({
  activeChatId,
  history,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
}: SidebarHistoryProps) {
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const {
    chats,
    groupedChats,
    totalChatCount,
    hasMore,
    searchQuery,
    sentinelRef,
  } = history;

  const renderChat = (chat: ChatSession) => (
    <SidebarChatRow
      key={chat.id}
      chat={chat}
      isActive={chat.id === activeChatId}
      onSelect={() => onSelectChat(chat.id)}
      onRename={() => onRenameChat(chat.id, chat.title)}
      onDelete={() => onDeleteChat(chat.id)}
    />
  );

  return (
    <div className="sidebar-scroll flex-1 select-none overflow-y-auto px-3 pb-24 pt-1">
      {chats === undefined ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-3 w-3 animate-spin rounded-full border border-foreground/25 border-t-transparent" />
        </div>
      ) : totalChatCount === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-[12px] text-foreground/38">No conversations yet</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="px-6 py-16 text-center text-[12px] text-foreground/38">
          No results for &quot;{searchQuery}&quot;
        </div>
      ) : (
        <>
          <button
            onClick={() => setHistoryCollapsed((collapsed) => !collapsed)}
            className="mt-0.5 flex h-8 w-full cursor-pointer items-center justify-between rounded-lg px-2.5 text-[11.5px] font-semibold text-foreground/48 transition-colors duration-[var(--motion-duration-fast)] hover:text-foreground/72"
          >
            <span>History</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-foreground/34 transition-transform duration-200",
                historyCollapsed && "-rotate-90"
              )}
            />
          </button>

          {!historyCollapsed && (
            <div className="space-y-1">
              {groupedChats.Today.length > 0 && (
                <section className="mb-1" aria-labelledby="sidebar-history-today">
                  <p id="sidebar-history-today" className="mb-0.5 mt-1 px-2.5 py-1 text-[10.5px] font-medium text-foreground/34">Today</p>
                  {groupedChats.Today.map(renderChat)}
                </section>
              )}

              {groupedChats.Yesterday.length > 0 && (
                <section className="mb-1" aria-labelledby="sidebar-history-yesterday">
                  <p id="sidebar-history-yesterday" className="mb-0.5 mt-2 px-2.5 py-1 text-[10.5px] font-medium text-foreground/34">Yesterday</p>
                  {groupedChats.Yesterday.map(renderChat)}
                </section>
              )}

              {groupedChats.Earlier.length > 0 && (
                <section className="mb-1" aria-labelledby="sidebar-history-earlier">
                  <p id="sidebar-history-earlier" className="mb-0.5 mt-2 px-2.5 py-1 text-[10.5px] font-medium text-foreground/34">Earlier</p>
                  {groupedChats.Earlier.map(renderChat)}
                </section>
              )}
            </div>
          )}

          {hasMore && (
            <div ref={sentinelRef} className="mt-1 flex h-5 items-center justify-center">
              <div className="h-2.5 w-2.5 animate-spin rounded-full border border-foreground/25 border-t-transparent" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
