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
      "sidebar-parent w-64 bg-background flex flex-col h-dvh flex-shrink-0 relative overflow-hidden",
      className
    )}>
      {/* Header — minimal, just brand + collapse */}
      <div className="h-14 px-4 flex items-center justify-between select-none flex-shrink-0">
        <span className="text-[13px] font-semibold tracking-[-0.01em] text-foreground/95">Paradox</span>
        <div className="flex items-center gap-0.5">
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-foreground/50 hover:text-foreground/90 hover:bg-foreground/[0.04] transition-all duration-200 cursor-pointer"
              title="Collapse sidebar"
            >
              <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" style={{ color: 'currentColor' }}><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M4.8 12C3.11984 12 2.27976 12 1.63803 11.673C1.07354 11.3854 0.614601 10.9265 0.32698 10.362C0 9.72024 0 8.88016 0 7.2V4.8C0 3.11984 0 2.27976 0.32698 1.63803C0.614601 1.07354 1.07354 0.614601 1.63803 0.32698C2.27976 0 3.11984 0 4.8 0H9.2C10.8802 0 11.7202 0 12.362 0.32698C12.9265 0.614601 13.3854 1.07354 13.673 1.63803C14 2.27976 14 3.11984 14 4.8V7.2C14 8.88016 14 9.72024 13.673 10.362C13.3854 10.9265 12.9265 11.3854 12.362 11.673C11.7202 12 10.8802 12 9.2 12H4.8ZM10.1 1.5C10.9401 1.5 11.3601 1.5 11.681 1.66349C11.9632 1.8073 12.1927 2.03677 12.3365 2.31901C12.5 2.63988 12.5 3.05992 12.5 3.9V8.1C12.5 8.94008 12.5 9.36012 12.3365 9.68099C12.1927 9.96323 11.9632 10.1927 11.681 10.3365C11.3601 10.5 10.9401 10.5 10.1 10.5H9.9C9.05992 10.5 8.63988 10.5 8.31901 10.3365C8.03677 10.1927 7.8073 9.96323 7.66349 9.68099C7.5 9.36012 7.5 8.94008 7.5 8.1V3.9C7.5 3.05992 7.5 2.63988 7.66349 2.31901C7.8073 2.03677 8.03677 1.8073 8.31901 1.66349C8.63988 1.5 9.05992 1.5 9.9 1.5H10.1ZM1.96094 2.82422C1.96094 2.47904 2.24076 2.19922 2.58594 2.19922H4.08594C4.43112 2.19922 4.71094 2.47904 4.71094 2.82422C4.71094 3.1694 4.43112 3.44922 4.08594 3.44922H2.58594C2.24076 3.44922 1.96094 3.1694 1.96094 2.82422ZM2.58594 4.19531C2.24076 4.19531 1.96094 4.47513 1.96094 4.82031C1.96094 5.16549 2.24076 5.44531 2.58594 5.44531H4.08594C4.43112 5.44531 4.71094 5.16549 4.71094 4.82031C4.71094 4.47513 4.43112 4.19531 4.08594 4.19531H2.58594Z"></path></svg>
            </button>
          )}
        </div>
      </div>

      {/* Actions — compact row */}
      <div className="px-2 pb-2 flex flex-col gap-px select-none">
        <button
          onClick={onNewChat}
          className="w-full h-[30px] rounded-md text-foreground/80 hover:text-foreground hover:bg-foreground/[0.05] text-[12px] font-normal flex items-center gap-2 px-2 transition-all duration-200"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0"><path d="M11.4875 0.512563C10.804 -0.170854 9.696 -0.170854 9.01258 0.512563L4.75098 4.77417C4.49563 5.02951 4.29308 5.33265 4.15488 5.66628L3.30712 7.71282C3.19103 7.99307 3.25519 8.31566 3.46968 8.53017C3.68417 8.74467 4.00676 8.80885 4.28702 8.69277L6.33382 7.84501C6.66748 7.70681 6.97066 7.50423 7.22604 7.24886L11.4875 2.98744C12.1709 2.30402 12.1709 1.19598 11.4875 0.512563Z" fill="currentColor"></path><path d="M2.75 1.5C2.05964 1.5 1.5 2.05964 1.5 2.75V9.25C1.5 9.94036 2.05964 10.5 2.75 10.5H9.25C9.94036 10.5 10.5 9.94036 10.5 9.25V7C10.5 6.58579 10.8358 6.25 11.25 6.25C11.6642 6.25 12 6.58579 12 7V9.25C12 10.7688 10.7688 12 9.25 12H2.75C1.23122 12 0 10.7688 0 9.25V2.75C0 1.23122 1.23122 4.84288e-08 2.75 4.84288e-08H5C5.41421 4.84288e-08 5.75 0.335786 5.75 0.75C5.75 1.16421 5.41421 1.5 5 1.5H2.75Z" fill="currentColor"></path></svg>
          <span>New chat</span>
        </button>

        {/* Desktop Search Trigger Button */}
        {hasChats && (
          <button
            onClick={onSearchClick}
            className={cn(
              "hidden md:flex w-full h-[30px] px-2 rounded-md items-center gap-2 transition-all duration-200 cursor-pointer text-[12px] font-normal",
              isSearchActive
                ? "bg-foreground/[0.08] text-foreground font-semibold"
                : "text-foreground/80 hover:text-foreground hover:bg-foreground/[0.05]"
            )}
          >
            <Search className="w-3 h-3 flex-shrink-0" />
            <span>Search</span>
          </button>
        )}

        {hasChats && (
          <button
            onClick={onLibraryClick}
            className={cn(
              "flex w-full h-[30px] px-2 rounded-md items-center gap-2 transition-all duration-200 cursor-pointer text-[12px] font-normal",
              isLibraryActive
                ? "bg-foreground/[0.08] text-foreground font-semibold"
                : "text-foreground/80 hover:text-foreground hover:bg-foreground/[0.05]"
            )}
          >
            <Folder className="w-3 h-3 flex-shrink-0" />
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
              className="w-full h-[30px] bg-transparent hover:bg-foreground/[0.03] focus:bg-foreground/[0.03] rounded-md py-1 pl-7 pr-3 text-[12px] text-foreground placeholder:text-foreground/45 border-none outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
            />
            <Search className="absolute left-2 top-[9px] w-3 h-3 text-foreground/45" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-[9px] text-foreground/45 hover:text-foreground/75"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-foreground/[0.04]" />

      {/* Chat Session List */}
      <div className="flex-1 overflow-y-auto px-2 pt-2.5 pb-2 select-none sidebar-scroll">
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
            <span className="text-[10px] font-semibold text-foreground/60 tracking-wide px-2 pb-1.5 block">
              Recent
            </span>

            <div className="space-y-px">
              {chats.map(chat => {
                const isActive = chat.id === activeChatId;

                return (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      "group relative w-full h-[30px] px-2 rounded-md flex items-center justify-between text-[12px] transition-all duration-200 cursor-pointer",
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
                          className="w-2.5 h-2.5 ml-1.5 flex-shrink-0 text-cyan-500/70"
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
                              "opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-all duration-200",
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
      <div className="px-2 py-2 flex-shrink-0 select-none">
        <button
          onClick={onSettingsClick}
          className={cn(
            "w-full h-[30px] px-2 rounded-md flex items-center gap-2 text-[12px] font-normal transition-all duration-200 cursor-pointer",
            isSettingsActive 
              ? "bg-foreground/[0.08] text-foreground font-semibold"
              : "text-foreground/80 hover:text-foreground hover:bg-foreground/[0.05]"
          )}
          title="Settings"
        >
          <Settings className="w-3 h-3 flex-shrink-0" />
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