import { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ChatSession } from '@/lib/db';
import { deleteChatSession, renameChatSession } from '@/hooks/use-chat-history';
import { Trash2, Edit3, Check, X, MessageSquare, Settings, ChevronLeft, Search, AlertTriangle, Folder, MoreVertical } from 'lucide-react';
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
  const { showToast } = useCustomToast();

  // High performance count metadata call
  const totalChatCount = useLiveQuery(() => db.chats.count());

  // Paginated live query with optional database-level search filtering
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

  // Reset limit when query changes to prevent overfetching search results
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

  // Group chats by date: Today, Yesterday, Earlier
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
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore]);

  return (
    <aside className={cn(
      "sidebar-parent w-64 bg-background/80 backdrop-blur-lg flex flex-col h-dvh flex-shrink-0 relative overflow-hidden border-r border-foreground/[0.06]",
      className
    )}>
      {/* Header — minimal, just brand + collapse */}
      <div className="h-14 px-3.5 flex items-center justify-between select-none flex-shrink-0">
        <img
          src="/chaticons/logo_chat.png"
          alt="Paradox"
          className="w-8 h-8 object-contain select-none"
        />
        <div className="flex items-center gap-0.5">
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-foreground/50 hover:text-foreground/90 hover:bg-foreground/[0.04] active:scale-[0.95] active:duration-75 transition-all duration-200 cursor-pointer"
              title="Collapse sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" style={{ color: 'currentColor' }}>
                <rect y="4.5" width="16" height="2" rx="1" fill="currentColor" />
                <rect y="9.5" width="11" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Actions — compact row */}
      <div className="px-3 pb-2 flex flex-col gap-1 select-none">
        <button
          onClick={onNewChat}
          className="w-full h-[36px] rounded-[9px] text-foreground/80 hover:text-foreground hover:bg-foreground/[0.05] active:scale-[0.97] text-[13px] font-medium flex items-center gap-2.5 px-3 transition-all duration-200"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0"><path d="M11.4875 0.512563C10.804 -0.170854 9.696 -0.170854 9.01258 0.512563L4.75098 4.77417C4.49563 5.02951 4.29308 5.33265 4.15488 5.66628L3.30712 7.71282C3.19103 7.99307 3.25519 8.31566 3.46968 8.53017C3.68417 8.74467 4.00676 8.80885 4.28702 8.69277L6.33382 7.84501C6.66748 7.70681 6.97066 7.50423 7.22604 7.24886L11.4875 2.98744C12.1709 2.30402 12.1709 1.19598 11.4875 0.512563Z" fill="currentColor"></path><path d="M2.75 1.5C2.05964 1.5 1.5 2.05964 1.5 2.75V9.25C1.5 9.94036 2.05964 10.5 2.75 10.5H9.25C9.94036 10.5 10.5 9.94036 10.5 9.25V7C10.5 6.58579 10.8358 6.25 11.25 6.25C11.6642 6.25 12 6.58579 12 7V9.25C12 10.7688 10.7688 12 9.25 12H2.75C1.23122 12 0 10.7688 0 9.25V2.75C0 1.23122 1.23122 4.84288e-08 2.75 4.84288e-08H5C5.41421 4.84288e-08 5.75 0.335786 5.75 0.75C5.75 1.16421 5.41421 1.5 5 1.5H2.75Z" fill="currentColor"></path></svg>
          <span>New chat</span>
        </button>

        {/* Desktop Search Trigger Button */}
        {hasChats && (
          <button
            onClick={onSearchClick}
            className={cn(
              "hidden md:flex w-full h-[36px] px-3 rounded-[9px] items-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-[0.97] text-[13px] font-medium",
              isSearchActive
                ? "bg-foreground/[0.08] text-foreground font-semibold"
                : "text-foreground/80 hover:text-foreground hover:bg-foreground/[0.05]"
            )}
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Search</span>
          </button>
        )}

        {hasChats && (
          <button
            onClick={onLibraryClick}
            className={cn(
              "flex w-full h-[36px] px-3 rounded-[9px] items-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-[0.97] text-[13px] font-medium",
              isLibraryActive
                ? "bg-foreground/[0.08] text-foreground font-semibold"
                : "text-foreground/80 hover:text-foreground hover:bg-foreground/[0.05]"
            )}
          >
            <Folder className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Library</span>
          </button>
        )}

        {/* Mobile Inline Search Bar */}
        {hasChats && (
          <div className="block md:hidden relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-[36px] bg-zinc-200/50 dark:bg-zinc-800/50 rounded-[9px] py-1.5 pl-8 pr-8 text-[13px] text-foreground placeholder:text-foreground/45 border-none outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
            />
            <Search className="absolute left-2.5 top-[11px] w-3.5 h-3.5 text-foreground/45" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-[11px] text-foreground/45 hover:text-foreground/75"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3.5 border-t border-zinc-200/40 dark:border-zinc-800/40" />

      {/* Chat Session List */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-2 select-none sidebar-scroll">
        {chats === undefined ? (
          <div className="flex items-center justify-center py-16 text-[11px] text-foreground/40">
            <div className="w-3 h-3 border border-foreground/30 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : totalChatCount === 0 ? (
          <div className="text-center py-20 px-6">
            <p className="text-[11px] text-foreground/45">No conversations</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-20 px-6 text-[11px] text-foreground/45">
            No results for &quot;{searchQuery}&quot;
          </div>
        ) : (
          <>
            <span className="text-[11px] font-medium text-foreground/45 tracking-wide px-1 pb-2 block uppercase">
              Recent
            </span>

            <div className="space-y-0.5">
              {chats.map(chat => {
                const isActive = chat.id === activeChatId;

                return (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      "group relative w-full h-[36px] px-3 rounded-[9px] flex items-center justify-between text-[13px] transition-all duration-200 cursor-pointer active:scale-[0.98]",
                      isActive
                        ? "bg-foreground/[0.08] text-foreground font-semibold"
                        : "text-foreground/80 hover:text-foreground hover:bg-foreground/[0.04]"
                    )}
                  >
                    <div className="flex items-center min-w-0 flex-1 pr-1">
                      <span className={cn(
                        "truncate text-left",
                        isActive && "font-semibold"
                      )}>{chat.title}</span>
                       {chat.branchedFromChatId && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="w-3 h-3 ml-1.5 flex-shrink-0 text-cyan-500/70"
                          aria-label="Branched conversation"
                        >
                          <path
                            d="M6.02,5.78m0,15.31V4.55m0,0v-1.91m0,3.14v-1.23m0,1.23c0,1.61,1.21,3.11,3.2,3.94l4.58,1.92c1.98,.83,3.2,2.32,3.2,3.94v3.84"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M20.53,17.59l-3.41,3.66-3.66-3.41"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Hover Actions */}
                    <div className="flex items-center flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={e => e.stopPropagation()}
                            onPointerDown={e => e.stopPropagation()}
                            className={cn(
                              "opacity-100 md:opacity-0 md:group-hover:opacity-100 data-[state=open]:opacity-100 transition-all duration-200",
                              "h-5 w-5 flex items-center justify-center rounded text-foreground/45 hover:text-foreground/85 hover:bg-foreground/[0.06] transition-all duration-150"
                            )}
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
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
              })}
            </div>

            {/* Infinite Scroll Sentinel */}
            {hasMore && (
              <div ref={sentinelRef} className="h-5 flex items-center justify-center mt-1">
                <div className="w-2.5 h-2.5 border border-foreground/30 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer — settings */}
      <div className="px-3 py-2 flex-shrink-0 select-none">
        <button
          onClick={onSettingsClick}
          className={cn(
            "w-full h-[36px] px-3 rounded-[9px] flex items-center gap-2.5 text-[13px] font-medium transition-all duration-200 cursor-pointer active:scale-[0.97]",
            isSettingsActive 
              ? "bg-foreground/[0.08] text-foreground font-semibold"
              : "text-foreground/80 hover:text-foreground hover:bg-foreground/[0.05]"
          )}
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5 flex-shrink-0" />
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