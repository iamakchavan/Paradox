"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Settings } from 'lucide-react';
import { db, type ChatSession } from '@/lib/db';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

type CommandActionId = 'new-chat' | 'settings';

const COMMAND_ACTIONS: Array<{
  id: CommandActionId;
  title: string;
  keywords: string[];
}> = [
  { id: 'new-chat', title: 'Create New Chat', keywords: ['new', 'chat', 'create', 'start'] },
  { id: 'settings', title: 'Settings', keywords: ['settings', 'preferences', 'appearance', 'api keys', 'providers', 'search scrape'] },
];

export function CommandPalette({ isOpen, onClose, onOpenSettings }: CommandPaletteProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredChats, setFilteredChats] = useState<ChatSession[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load chats count and top 50 recent chats from db when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // 1. Fetch total count optimized
    db.chats
      .count()
      .then((count) => setTotalCount(count))
      .catch((err) => console.error('[CommandPalette DB Count]:', err));

    // 2. Fetch top 50 recent chats optimized via orderBy index
    db.chats
      .orderBy('updatedAt')
      .reverse()
      .limit(50)
      .toArray()
      .then((arr) => {
        setChats(arr);
      })
      .catch((err) => console.error('[CommandPalette DB Fetch]:', err));

    setSearchQuery('');
    setSelectedIndex(0);

    // Focus input on open
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Handle key listeners (Radix handles Escape natively, so we only handle arrows/Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (flatItems.length === 0) return;
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (flatItems.length === 0) return;
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerAction(selectedIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, chats, searchQuery]);

  // Helper to calculate relative timestamps
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 36) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (days < 7) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    return `${days} days ago`;
  };

  // Update filteredChats dynamically (searches all threads in database when query is entered)
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setFilteredChats(chats.slice(0, 5));
      return;
    }

    db.chats
      .filter((c) => c.title.toLowerCase().includes(query))
      .limit(5)
      .toArray()
      .then((results) => {
        const sorted = results.sort((a, b) => {
          const timeA = a.updatedAt ?? a.createdAt;
          const timeB = b.updatedAt ?? b.createdAt;
          return timeB - timeA;
        });
        setFilteredChats(sorted);
      })
      .catch((err) => console.error('[CommandPalette Search Error]:', err));
  }, [searchQuery, chats]);

  // Flat list of items mapping visual structure for perfect arrow navigation
  const flatItems = useMemo(() => {
    const items: Array<
      | { type: 'action'; id: CommandActionId; title: string }
      | { type: 'chat'; id: string; title: string; updatedAt: number; createdAt: number; chat: ChatSession }
    > = [];
    const query = searchQuery.trim().toLowerCase();

    COMMAND_ACTIONS
      .filter((action) => {
        if (!query) return true;
        return action.title.toLowerCase().includes(query) || action.keywords.some((keyword) => keyword.includes(query));
      })
      .forEach((action) => items.push({ type: 'action', id: action.id, title: action.title }));

    // Date grouping categories
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const todayList = filteredChats.filter((c) => (c.updatedAt ?? c.createdAt) >= startOfToday.getTime());
    const yesterdayList = filteredChats.filter(
      (c) =>
        (c.updatedAt ?? c.createdAt) < startOfToday.getTime() &&
        (c.updatedAt ?? c.createdAt) >= startOfYesterday.getTime()
    );
    const earlierList = filteredChats.filter((c) => (c.updatedAt ?? c.createdAt) < startOfYesterday.getTime());

    todayList.forEach((c) => items.push({ type: 'chat', id: c.id, title: c.title, updatedAt: c.updatedAt ?? c.createdAt, createdAt: c.createdAt, chat: c }));
    yesterdayList.forEach((c) => items.push({ type: 'chat', id: c.id, title: c.title, updatedAt: c.updatedAt ?? c.createdAt, createdAt: c.createdAt, chat: c }));
    earlierList.forEach((c) => items.push({ type: 'chat', id: c.id, title: c.title, updatedAt: c.updatedAt ?? c.createdAt, createdAt: c.createdAt, chat: c }));

    return items;
  }, [filteredChats, searchQuery]);

  useEffect(() => {
    setSelectedIndex((index) => {
      if (flatItems.length === 0) return 0;
      return Math.min(index, flatItems.length - 1);
    });
  }, [flatItems.length]);

  // Trigger select action
  const triggerAction = (index: number) => {
    const item = flatItems[index];
    if (!item) return;

    if (item.type === 'action') {
      if (item.id === 'new-chat') {
        router.push('/chat');
        onClose();
      } else if (item.id === 'settings') {
        onClose();
        requestAnimationFrame(onOpenSettings);
      }
    } else {
      router.push(`/chat/${item.id}`);
      onClose();
    }
  };

  // Scroll selected active item into view
  useEffect(() => {
    const element = containerRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (element) {
      element.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Date categories variables for rendering headers
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  let lastCategory: string | null = null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open && isOpen) onClose(); }}>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop Overlay */}
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-[6px] z-50"
                />
              </DialogPrimitive.Overlay>

              {/* Modal Content Card */}
              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  ref={containerRef}
                  initial={{ opacity: 0, scale: 0.95, x: '-50%', y: -20 }}
                  animate={{ opacity: 1, scale: 1, x: '-50%', y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: '-50%', y: -20 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="fixed left-1/2 top-[12dvh] z-50 w-[calc(100vw-2rem)] max-w-[640px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl shadow-black/10 dark:shadow-black/60 rounded-[24px] overflow-hidden flex flex-col tracking-wide outline-none"
                >
                  <DialogPrimitive.Title className="sr-only">Search threads</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">Search and browse saved chat sessions</DialogPrimitive.Description>
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-5 h-[56px] border-b border-zinc-100 dark:border-zinc-800/60">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-[15px] text-foreground outline-none border-none placeholder-foreground/35 select-none"
          />
          <Search className="w-[17px] h-[17px] text-zinc-400 dark:text-zinc-500 flex-shrink-0" strokeWidth={2} />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 max-h-[380px] overflow-y-auto p-4 space-y-1.5 sidebar-scroll">
          {flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-foreground/45 select-none">
              No results found
            </div>
          ) : flatItems.map((item, index) => {
            const isSelected = selectedIndex === index;
            
            // Determine header category insertion
            let categoryHeader: string | null = null;
            if (item.type === 'action') {
              if (lastCategory !== 'Actions') {
                categoryHeader = 'Actions';
                lastCategory = 'Actions';
              }
            } else {
              const time = item.updatedAt;
              let currentCat = 'Last 7 Days';
              if (time >= startOfToday.getTime()) {
                currentCat = 'Today';
              } else if (time >= startOfYesterday.getTime()) {
                currentCat = 'Yesterday';
              }

              if (lastCategory !== currentCat) {
                categoryHeader = currentCat;
                lastCategory = currentCat;
              }
            }

            return (
              <div key={`${item.id}-${index}`} className="space-y-1">
                {categoryHeader && (
                  <p className="text-[12px] font-normal text-foreground/45 px-3 pt-3 pb-1 select-none first:pt-0">
                    {categoryHeader}
                  </p>
                )}
                <div
                  data-index={index}
                  onClick={() => triggerAction(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center justify-between px-4 h-[42px] rounded-xl cursor-pointer select-none border border-transparent font-normal",
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-800 text-foreground"
                      : "text-foreground/75 hover:text-foreground"
                  )}
                >
                  {item.type === 'action' ? (
                    <div className="flex items-center gap-2.5">
                      {item.id === 'settings' ? (
                        <Settings className="w-[15px] h-[15px] flex-shrink-0 text-foreground/60" strokeWidth={2.2} />
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 text-foreground/60">
                          <path d="M11.4875 0.512563C10.804 -0.170854 9.696 -0.170854 9.01258 0.512563L4.75098 4.77417C4.49563 5.02951 4.29308 5.33265 4.15488 5.66628L3.30712 7.71282C3.19103 7.99307 3.25519 8.31566 3.46968 8.53017C3.68417 8.74467 4.00676 8.80885 4.28702 8.69277L6.33382 7.84501C6.66748 7.70681 6.97066 7.50423 7.22604 7.24886L11.4875 2.98744C12.1709 2.30402 12.1709 1.19598 11.4875 0.512563Z" fill="currentColor"/>
                          <path d="M2.75 1.5C2.05964 1.5 1.5 2.05964 1.5 2.75V9.25C1.5 9.94036 2.05964 10.5 2.75 10.5H9.25C9.94036 10.5 10.5 9.94036 10.5 9.25V7C10.5 6.58579 10.8358 6.25 11.25 6.25C11.6642 6.25 12 6.58579 12 7V9.25C12 10.7688 10.7688 12 9.25 12H2.75C1.23122 12 0 10.7688 0 9.25V2.75C0 1.23122 1.23122 4.84288e-08 2.75 4.84288e-08H5C5.41421 4.84288e-08 5.75 0.335786 5.75 0.75C5.75 1.16421 5.41421 1.5 5 1.5H2.75Z" fill="currentColor"/>
                        </svg>
                      )}
                      <span className="text-[14px]">{item.title}</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-[14px] truncate flex-1 pr-4">{item.title}</span>
                      <span className="text-[11.5px] text-foreground/35 flex-shrink-0 font-normal">
                        {getRelativeTime(item.updatedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Bar */}
        <div className="h-[42px] bg-foreground/[0.01] border-t border-zinc-100 dark:border-zinc-800/60 px-5 flex items-center justify-between select-none">
          {/* Guidelines on Left */}
          <div className="flex items-center gap-4 text-foreground/45 text-[10.5px]">
            <span className="flex items-center gap-1.5">
              <span>Open</span>
              <kbd className="border border-foreground/[0.08] bg-foreground/[0.02] px-1.5 py-0.5 rounded font-mono text-[9px] leading-none shadow-sm">↵</kbd>
            </span>
          </div>

          {/* Results Count on Right */}
          <div className="text-[11px] text-foreground/35 font-normal">
            {totalCount} {totalCount === 1 ? 'total thread' : 'total threads'}
          </div>
        </div>

          </motion.div>
      </DialogPrimitive.Content>
      </>
    )}
  </AnimatePresence>
</DialogPrimitive.Portal>
</DialogPrimitive.Root>
);
}
