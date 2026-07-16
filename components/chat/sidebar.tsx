"use client";

import { cn } from '@/lib/utils';
import { SidebarChatDialogs } from './sidebar/SidebarChatDialogs';
import { SidebarFooter } from './sidebar/SidebarFooter';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarHistory } from './sidebar/SidebarHistory';
import { SidebarNavigation } from './sidebar/SidebarNavigation';
import type { SidebarProps } from './sidebar/types';
import { useSidebarChatManagement } from './sidebar/use-sidebar-chat-management';
import { useSidebarHistory } from './sidebar/use-sidebar-history';

export function Sidebar({
  activeChatId,
  onSelectChat,
  onNewChat,
  onActiveChatDeleted,
  className,
  onCollapse,
  isSearchActive = false,
  onSearchClick,
  isLibraryActive = false,
  onLibraryClick,
  isSettingsActive = false,
  onSettingsClick,
  isIntegrationsActive = false,
  onIntegrationsClick,
}: SidebarProps) {
  const history = useSidebarHistory();
  const management = useSidebarChatManagement({
    activeChatId,
    chats: history.chats,
    onActiveChatDeleted: onActiveChatDeleted ?? onNewChat,
  });

  return (
    <aside
      className={cn(
        "sidebar-parent relative flex h-dvh w-full flex-shrink-0 flex-col overflow-hidden border-r border-black/[0.055] bg-zinc-50 dark:border-white/[0.055] dark:bg-zinc-950 md:w-[270px]",
        className
      )}
    >
      <SidebarHeader onCollapse={onCollapse} />

      <SidebarNavigation
        onNewChat={onNewChat}
        isSearchActive={isSearchActive}
        onSearchClick={onSearchClick}
        isLibraryActive={isLibraryActive}
        onLibraryClick={onLibraryClick}
        isIntegrationsActive={isIntegrationsActive}
        onIntegrationsClick={onIntegrationsClick}
        isNewChatActive={
          activeChatId === null &&
          !isSearchActive &&
          !isLibraryActive &&
          !isSettingsActive &&
          !isIntegrationsActive
        }
        hasChats={history.hasChats}
      />

      <div className="mx-4 mt-1 border-t border-foreground/[0.055]" />

      <SidebarHistory
        activeChatId={activeChatId}
        history={history}
        onSelectChat={onSelectChat}
        onRenameChat={management.startRename}
        onDeleteChat={management.requestDelete}
      />

      <SidebarFooter
        isSettingsActive={isSettingsActive}
        onSettingsClick={onSettingsClick}
      />

      <SidebarChatDialogs management={management} />
    </aside>
  );
}
