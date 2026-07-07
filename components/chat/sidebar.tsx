import { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ChatSession } from '@/lib/db';
import { deleteChatSession, renameChatSession } from '@/hooks/use-chat-history';
import { Trash2, Edit3, Settings, Search, Folder, MoreVertical, ChevronDown, ChevronsLeft, Puzzle, Plus, History, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { RenameConfirmModal } from './RenameConfirmModal';
import { useCustomToast } from '@/components/ui/custom-toast';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';


interface SidebarProps {
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
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

export function Sidebar({ 
  activeChatId, 
  onSelectChat, 
  onNewChat, 
  className, 
  onCollapse,
  isSearchActive = false,
  onSearchClick,
  isLibraryActive = false,
  onLibraryClick,
  isSettingsActive = false,
  onSettingsClick,
  isIntegrationsActive = false,
  onIntegrationsClick
}: SidebarProps) {
  const PAGE_SIZE = 20;
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const { showToast } = useCustomToast();
  const { resolvedTheme, setTheme } = useTheme();

  const totalChatCount = useLiveQuery(() => db.chats.count());

  const chats = useLiveQuery(
    () => {
      return db.chats
        .toArray()
        .then(arr => {
          // Sort in-memory: fallback to createdAt if updatedAt is missing
          const sorted = arr.sort((a, b) => {
            const timeA = a.updatedAt ?? a.createdAt;
            const timeB = b.updatedAt ?? b.createdAt;
            return timeB - timeA;
          });

          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return sorted
              .filter(chat => chat.title.toLowerCase().includes(query))
              .slice(0, visibleLimit);
          }
          return sorted.slice(0, visibleLimit);
        });
    },
    [visibleLimit, searchQuery]
  );

  const deleteTargetTitle = useMemo(() => {
    if (!deleteTargetId || !chats) return '';
    const chat = chats.find(c => c.id === deleteTargetId);
    return chat ? chat.title : '';
  }, [deleteTargetId, chats]);

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [searchQuery]);

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      await deleteChatSession(deleteTargetId);
      showToast({
        message: 'Conversation deleted',
        type: 'success',
        mode: 'capsule',
      });
      if (activeChatId === deleteTargetId) {
        onNewChat();
      }
      setDeleteTargetId(null);
    }
  };

  // Group chats by date
  const groupedChats = useMemo(() => {
    const groups: { Today: ChatSession[]; Yesterday: ChatSession[]; Earlier: ChatSession[] } = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };
    if (!chats) return groups;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    chats.forEach(chat => {
      const chatTime = chat.updatedAt || chat.createdAt;
      if (chatTime >= startOfToday.getTime()) {
        groups.Today.push(chat);
      } else if (chatTime >= startOfYesterday.getTime()) {
        groups.Yesterday.push(chat);
      } else {
        groups.Earlier.push(chat);
      }
    });

    return groups;
  }, [chats]);

  const hasChats = totalChatCount !== undefined && totalChatCount > 0;
  const hasMore = chats ? chats.length === visibleLimit : false;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleLimit((prev) => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => { if (currentSentinel) observer.unobserve(currentSentinel); };
  }, [hasMore]);

  const ChatRow = ({ chat }: { chat: ChatSession }) => {
    const isActive = chat.id === activeChatId;
    return (
      <div
        key={chat.id}
        onClick={() => onSelectChat(chat.id)}
        className={cn(
          "group relative w-full h-[34px] px-3 rounded-lg flex items-center justify-between text-[13px] transition-all duration-150 cursor-pointer border select-none",
          isActive
            ? "bg-white dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800/60 shadow-sm text-foreground font-medium"
            : "border-transparent text-foreground/65 hover:text-foreground hover:bg-foreground/[0.03]"
        )}
      >
        <span className="truncate flex-1 pr-1">{chat.title}</span>

        {/* Hover Actions */}
        <div className="flex items-center flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
                className={cn(
                  "opacity-100 md:opacity-0 md:group-hover:opacity-100 data-[state=open]:opacity-100 transition-all duration-150",
                  "h-6 w-6 flex items-center justify-center rounded-md text-foreground/40 hover:text-foreground/80 hover:bg-foreground/[0.05]"
                )}
                title="More options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-40 rounded-xl border border-foreground/[0.08] bg-popover/98 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur-md dark:shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
            >
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  handleStartRename(chat.id, chat.title, e as any);
                }}
                className="flex h-9 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium text-foreground/78 transition-colors hover:bg-foreground/[0.05] focus:bg-foreground/[0.05]"
              >
                <Edit3 className="h-4 w-4 text-foreground/52" strokeWidth={1.9} />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteClick(chat.id, e as any);
                }}
                className="flex h-9 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-500/[0.08] focus:bg-red-500/[0.08] focus:text-red-500"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.9} />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <aside className={cn(
      "sidebar-parent w-full md:w-[270px] bg-background flex flex-col h-dvh flex-shrink-0 relative overflow-hidden border-r border-foreground/[0.06]",
      className
    )}>

      {/* ── Header ── */}
      <div className="h-[56px] px-4 flex items-center justify-between select-none flex-shrink-0 border-b border-foreground/[0.04]">
        <img
          src="/chaticons/logo_chat.png"
          alt="Paradox"
          className="w-7 h-7 object-contain select-none opacity-90"
        />
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/40 hover:text-foreground/80 hover:bg-foreground/[0.05] active:scale-[0.93] active:duration-75 transition-all duration-200 cursor-pointer"
            title="Collapse sidebar"
          >
            <ChevronsLeft className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ── Primary Nav ── */}
      <div className="p-3 space-y-1 select-none flex-shrink-0">

        {/* Search */}
        <button
          onClick={onSearchClick}
          className={cn(
            "w-full h-[36px] px-3 rounded-lg flex items-center gap-2.5 text-[13px] font-medium transition-all duration-150 cursor-pointer border",
            isSearchActive
              ? "bg-white dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800/60 shadow-sm text-foreground font-semibold"
              : "bg-foreground/[0.02] border-transparent text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05]"
          )}
        >
          <Search className="w-4 h-4 text-foreground/50 flex-shrink-0" strokeWidth={2.2} />
          <span>Search</span>
        </button>

        {/* New Chat */}
        <button
          onClick={onNewChat}
          className="w-full h-[36px] px-3 rounded-lg flex items-center gap-2.5 text-[13px] font-medium border border-transparent text-foreground/60 hover:text-foreground hover:bg-foreground/[0.04] transition-all duration-150 cursor-pointer"
        >
          <svg width="17" height="17" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 text-foreground/50">
            <path d="M11.4875 0.512563C10.804 -0.170854 9.696 -0.170854 9.01258 0.512563L4.75098 4.77417C4.49563 5.02951 4.29308 5.33265 4.15488 5.66628L3.30712 7.71282C3.19103 7.99307 3.25519 8.31566 3.46968 8.53017C3.68417 8.74467 4.00676 8.80885 4.28702 8.69277L6.33382 7.84501C6.66748 7.70681 6.97066 7.50423 7.22604 7.24886L11.4875 2.98744C12.1709 2.30402 12.1709 1.19598 11.4875 0.512563Z" fill="currentColor"/>
            <path d="M2.75 1.5C2.05964 1.5 1.5 2.05964 1.5 2.75V9.25C1.5 9.94036 2.05964 10.5 2.75 10.5H9.25C9.94036 10.5 10.5 9.94036 10.5 9.25V7C10.5 6.58579 10.8358 6.25 11.25 6.25C11.6642 6.25 12 6.58579 12 7V9.25C12 10.7688 10.7688 12 9.25 12H2.75C1.23122 12 0 10.7688 0 9.25V2.75C0 1.23122 1.23122 4.84288e-08 2.75 4.84288e-08H5C5.41421 4.84288e-08 5.75 0.335786 5.75 0.75C5.75 1.16421 5.41421 1.5 5 1.5H2.75Z" fill="currentColor"/>
          </svg>
          <span>New Chat</span>
        </button>

        {/* Library */}
        {hasChats && (
          <button
            onClick={onLibraryClick}
            className={cn(
              "w-full h-[36px] px-3 rounded-lg flex items-center gap-2.5 text-[13px] font-medium transition-all duration-150 cursor-pointer border",
              isLibraryActive
                ? "bg-white dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800/60 shadow-sm text-foreground font-semibold"
                : "border-transparent text-foreground/65 hover:text-foreground hover:bg-foreground/[0.04]"
            )}
          >
            <Folder className="w-4 h-4 text-foreground/50 flex-shrink-0" strokeWidth={2.2} />
            <span>Library</span>
          </button>
        )}

        {/* Apps & Tools */}
        <button
          onClick={onIntegrationsClick}
          className={cn(
            "w-full h-[36px] px-3 rounded-lg flex items-center gap-2.5 text-[13px] font-medium transition-all duration-150 cursor-pointer border",
            isIntegrationsActive
              ? "bg-white dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800/60 shadow-sm text-foreground font-semibold"
              : "border-transparent text-foreground/65 hover:text-foreground hover:bg-foreground/[0.04]"
          )}
        >
          <Puzzle className="w-4 h-4 text-foreground/50 flex-shrink-0" strokeWidth={2.2} />
          <span>Apps & Tools</span>
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 my-1 border-t border-foreground/[0.04]" />

      {/* ── Chat History ── */}
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
            {/* History section header */}
            <button
              onClick={() => setHistoryCollapsed(v => !v)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold text-foreground/45 hover:text-foreground/70 transition-colors duration-150 cursor-pointer mt-1"
            >
              <span>History</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", historyCollapsed && "-rotate-90")} />
            </button>

            {!historyCollapsed && (
              <div className="space-y-[3px]">
                {/* Today */}
                {groupedChats.Today.length > 0 && (
                  <div className="mb-1">
                    <p className="text-[11px] font-semibold text-foreground/35 px-3 py-1 mt-2 mb-0.5">Today</p>
                    {groupedChats.Today.map(chat => <ChatRow key={chat.id} chat={chat} />)}
                  </div>
                )}

                {/* Yesterday */}
                {groupedChats.Yesterday.length > 0 && (
                  <div className="mb-1">
                    <p className="text-[11px] font-semibold text-foreground/35 px-3 py-1 mt-2 mb-0.5">Yesterday</p>
                    {groupedChats.Yesterday.map(chat => <ChatRow key={chat.id} chat={chat} />)}
                  </div>
                )}

                {/* Earlier */}
                {groupedChats.Earlier.length > 0 && (
                  <div className="mb-1">
                    <p className="text-[11px] font-semibold text-foreground/35 px-3 py-1 mt-2 mb-0.5">Earlier</p>
                    {groupedChats.Earlier.map(chat => <ChatRow key={chat.id} chat={chat} />)}
                  </div>
                )}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div ref={sentinelRef} className="h-5 flex items-center justify-center mt-1">
                <div className="w-2.5 h-2.5 border border-foreground/30 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer Settings & Theme Switch ── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none flex items-end justify-center gap-2 pb-4 z-20">
        <div className="absolute inset-0 progressive-blur pointer-events-none" />
        <button
          onClick={onSettingsClick}
          className={cn(
            "sidebar-footer-pill pointer-events-auto h-[34px] px-3.5 rounded-full liquid-glass-dock flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer relative z-10 active:scale-[0.96] text-foreground/70 hover:text-foreground",
            isSettingsActive && "text-foreground ring-1 ring-foreground/10"
          )}
        >
          <Settings className="w-3.5 h-3.5 text-foreground/50 flex-shrink-0" strokeWidth={2.2} />
          <span>Settings</span>
        </button>

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="sidebar-footer-pill pointer-events-auto w-[34px] h-[34px] rounded-full liquid-glass-dock flex items-center justify-center cursor-pointer relative z-10 active:scale-[0.96] text-foreground/70 hover:text-foreground"
          title="Toggle theme"
        >
          <Sun className="sidebar-theme-icon h-[14px] w-[14px] flex-shrink-0 opacity-100 dark:opacity-0" strokeWidth={2.2} />
          <Moon className="sidebar-theme-icon absolute h-[14px] w-[14px] flex-shrink-0 opacity-0 dark:opacity-100" strokeWidth={2.2} />
          <span className="sr-only">Toggle theme</span>
        </button>
      </div>

      <DeleteConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        entryTitle={deleteTargetTitle}
      />

      <RenameConfirmModal
        isOpen={editingId !== null}
        onClose={() => setEditingId(null)}
        onConfirm={async (newTitle) => {
          if (editingId) {
            await renameChatSession(editingId, newTitle);
            showToast({
              message: 'Conversation renamed',
              type: 'success',
              mode: 'capsule',
            });
            setEditingId(null);
          }
        }}
        currentTitle={editTitle}
      />
    </aside>
  );
}
