import { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ChatSession } from '@/lib/db';
import { deleteChatSession, renameChatSession } from '@/hooks/use-chat-history';
import { Trash2, Edit3, Settings, Search, Folder, MoreVertical, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { RenameConfirmModal } from './RenameConfirmModal';
import { useCustomToast } from '@/components/ui/custom-toast';
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
  onSettingsClick
}: SidebarProps) {
  const PAGE_SIZE = 20;
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const { showToast } = useCustomToast();

  const totalChatCount = useLiveQuery(() => db.chats.count());

  const chats = useLiveQuery(
    () => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return db.chats
          .filter(chat => chat.title.toLowerCase().includes(query))
          .reverse()
          .limit(visibleLimit)
          .toArray();
      }
      return db.chats.orderBy('createdAt').reverse().limit(visibleLimit).toArray();
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
      const chatTime = chat.createdAt;
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
          "group relative w-full h-[33px] px-2.5 rounded-[8px] flex items-center justify-between text-[13px] transition-all duration-150 cursor-pointer",
          isActive
            ? "bg-foreground/[0.07] text-foreground font-medium"
            : "text-foreground/65 hover:text-foreground/90 hover:bg-foreground/[0.04]"
        )}
      >
        <span className="truncate flex-1 pr-1 select-none">{chat.title}</span>

        {/* Hover Actions */}
        <div className="flex items-center flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
                className={cn(
                  "opacity-100 md:opacity-0 md:group-hover:opacity-100 data-[state=open]:opacity-100 transition-all duration-150",
                  "h-5 w-5 flex items-center justify-center rounded text-foreground/40 hover:text-foreground/80 hover:bg-foreground/[0.06]"
                )}
                title="More options"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28 bg-popover/95 backdrop-blur-md border border-foreground/[0.08] shadow-lg rounded-lg p-1">
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  handleStartRename(chat.id, chat.title, e as any);
                }}
                className="text-[11px] flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-md hover:bg-foreground/[0.04] transition-colors"
              >
                <Edit3 className="w-3 h-3 text-foreground/60" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteClick(chat.id, e as any);
                }}
                className="text-[11px] flex items-center gap-2 text-red-500 focus:text-red-500 hover:bg-red-500/5 focus:bg-red-500/5 cursor-pointer py-1.5 px-2 rounded-md transition-colors"
              >
                <Trash2 className="w-3 h-3" />
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
      "sidebar-parent w-64 bg-background/80 backdrop-blur-lg flex flex-col h-dvh flex-shrink-0 relative overflow-hidden border-r border-foreground/[0.06]",
      className
    )}>

      {/* ── Header ── */}
      <div className="h-14 px-3.5 flex items-center justify-between select-none flex-shrink-0">
        <img
          src="/chaticons/logo_chat.png"
          alt="Paradox"
          className="w-7 h-7 object-contain select-none opacity-90"
        />
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-foreground/40 hover:text-foreground/80 hover:bg-foreground/[0.05] active:scale-[0.93] active:duration-75 transition-all duration-200 cursor-pointer"
            title="Collapse sidebar"
          >
            {/* Double chevron left */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.5 10.5L5 7L8.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 10.5L8.5 7L12 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Primary Nav ── */}
      <div className="px-2 pb-1 flex flex-col gap-0.5 select-none flex-shrink-0">

        {/* Search */}
        <button
          onClick={onSearchClick}
          className={cn(
            "w-full h-9 px-3 rounded-[10px] flex items-center gap-3 text-[13.5px] font-medium transition-all duration-150 cursor-pointer active:scale-[0.98]",
            isSearchActive
              ? "bg-foreground/[0.08] text-foreground"
              : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.05]"
          )}
        >
          <Search className="w-[15px] h-[15px] flex-shrink-0" strokeWidth={2} />
          <span>Search</span>
        </button>

        {/* New Chat */}
        <button
          onClick={onNewChat}
          className="w-full h-9 px-3 rounded-[10px] flex items-center gap-3 text-[13.5px] font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/[0.05] active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
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
              "w-full h-9 px-3 rounded-[10px] flex items-center gap-3 text-[13.5px] font-medium transition-all duration-150 cursor-pointer active:scale-[0.98]",
              isLibraryActive
                ? "bg-foreground/[0.08] text-foreground"
                : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.05]"
            )}
          >
            <Folder className="w-[15px] h-[15px] flex-shrink-0" strokeWidth={2} />
            <span>Library</span>
          </button>
        )}



      </div>

      {/* ── Divider ── */}
      <div className="mx-3 mb-1 border-t border-foreground/[0.06]" />

      {/* ── Chat History ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 select-none sidebar-scroll">
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
              className="w-full flex items-center gap-1 px-1.5 py-2 text-[11px] font-semibold text-foreground/40 tracking-wider uppercase hover:text-foreground/60 transition-colors duration-150 cursor-pointer"
            >
              <span>History</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", historyCollapsed && "-rotate-90")} />
            </button>

            {!historyCollapsed && (
              <div className="space-y-0.5">
                {/* Today */}
                {groupedChats.Today.length > 0 && (
                  <div className="mb-1">
                    <p className="text-[10.5px] font-medium text-foreground/30 px-2.5 py-1 tracking-wide">Today</p>
                    {groupedChats.Today.map(chat => <ChatRow key={chat.id} chat={chat} />)}
                  </div>
                )}

                {/* Yesterday */}
                {groupedChats.Yesterday.length > 0 && (
                  <div className="mb-1">
                    <p className="text-[10.5px] font-medium text-foreground/30 px-2.5 py-1 tracking-wide">Yesterday</p>
                    {groupedChats.Yesterday.map(chat => <ChatRow key={chat.id} chat={chat} />)}
                  </div>
                )}

                {/* Earlier */}
                {groupedChats.Earlier.length > 0 && (
                  <div className="mb-1">
                    <p className="text-[10.5px] font-medium text-foreground/30 px-2.5 py-1 tracking-wide">Earlier</p>
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

      {/* ── Footer — Settings ── */}
      <div className="px-2 py-2 flex-shrink-0 select-none border-t border-foreground/[0.06]">
        <button
          onClick={onSettingsClick}
          className={cn(
            "w-full h-9 px-3 rounded-[10px] flex items-center gap-3 text-[13.5px] font-medium transition-all duration-150 cursor-pointer active:scale-[0.98]",
            isSettingsActive
              ? "bg-foreground/[0.08] text-foreground"
              : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.05]"
          )}
          title="Settings"
        >
          <Settings className="w-[15px] h-[15px] flex-shrink-0" strokeWidth={2} />
          <span>Settings</span>
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