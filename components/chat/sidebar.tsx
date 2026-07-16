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
        "sidebar-parent w-full md:w-[270px] bg-background flex flex-col h-dvh flex-shrink-0 relative overflow-hidden border-r border-foreground/[0.06]",
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
        hasChats={history.hasChats}
      />

      <div className="mx-3 my-1 border-t border-foreground/[0.04]" />

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
