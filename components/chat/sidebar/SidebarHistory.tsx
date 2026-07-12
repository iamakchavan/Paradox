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
    <div className="flex-1 overflow-y-auto px-3 pb-20 select-none sidebar-scroll">
      {chats === undefined ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-3 h-3 border border-foreground/30 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : totalChatCount === 0 ? (
        <div className="text-center py-20 px-6">
          <p className="text-[12px] text-foreground/35">No conversations yet</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-20 px-6 text-[12px] text-foreground/35">
          No results for &quot;{searchQuery}&quot;
        </div>
      ) : (
        <>
          <button
            onClick={() => setHistoryCollapsed((collapsed) => !collapsed)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold text-foreground/45 hover:text-foreground/70 transition-colors duration-150 cursor-pointer mt-1"
          >
            <span>History</span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                historyCollapsed && "-rotate-90"
              )}
            />
          </button>

          {!historyCollapsed && (
            <div className="space-y-[3px]">
              {groupedChats.Today.length > 0 && (
                <div className="mb-1">
                  <p className="text-[11px] font-semibold text-foreground/35 px-3 py-1 mt-2 mb-0.5">Today</p>
                  {groupedChats.Today.map(renderChat)}
                </div>
              )}

              {groupedChats.Yesterday.length > 0 && (
                <div className="mb-1">
                  <p className="text-[11px] font-semibold text-foreground/35 px-3 py-1 mt-2 mb-0.5">Yesterday</p>
                  {groupedChats.Yesterday.map(renderChat)}
                </div>
              )}

              {groupedChats.Earlier.length > 0 && (
                <div className="mb-1">
                  <p className="text-[11px] font-semibold text-foreground/35 px-3 py-1 mt-2 mb-0.5">Earlier</p>
                  {groupedChats.Earlier.map(renderChat)}
                </div>
              )}
            </div>
          )}

          {hasMore && (
            <div ref={sentinelRef} className="h-5 flex items-center justify-center mt-1">
              <div className="w-2.5 h-2.5 border border-foreground/30 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
