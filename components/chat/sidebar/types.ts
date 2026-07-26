import type { ChatSession } from '@/lib/db';

export interface SidebarProps {
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onActiveChatDeleted?: () => void;
  className?: string;
  onCollapse?: () => void;
  isSearchActive?: boolean;
  onSearchClick?: () => void;
  isLibraryActive?: boolean;
  onLibraryClick?: () => void;
  isSettingsActive?: boolean;
  onSettingsClick?: () => void;
  isIntegrationsActive?: boolean;
  onIntegrationsClick?: () => void;
}

export interface GroupedChats {
  Today: ChatSession[];
  Yesterday: ChatSession[];
  Earlier: ChatSession[];
}
