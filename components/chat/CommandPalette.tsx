"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Settings, SquarePen } from 'lucide-react';
import { db, type ChatSession } from '@/lib/db';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
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

    let cancelled = false;

    db.chats
      .filter((c) => c.title.toLowerCase().includes(query))
      .toArray()
      .then((results) => {
        if (cancelled) return;
        const sorted = results.sort((a, b) => {
          const timeA = a.updatedAt ?? a.createdAt;
          const timeB = b.updatedAt ?? b.createdAt;
          return timeB - timeA;
        });
        setFilteredChats(sorted);
      })
      .catch((err) => console.error('[CommandPalette Search Error]:', err));

    return () => {
      cancelled = true;
    };
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
        <AnimatePresence initial={false}>
          {isOpen && (
            <>
              {/* Backdrop Overlay */}
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  key="command-palette-overlay"
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
                  key="command-palette-content"
                  ref={containerRef}
                  initial={{ opacity: 0, scale: 0.95, x: '-50%', y: -20 }}
                  animate={{ opacity: 1, scale: 1, x: '-50%', y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: '-50%', y: -20 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="fixed left-1/2 top-[11dvh] z-50 flex w-[calc(100vw-2rem)] max-w-[660px] flex-col overflow-hidden rounded-[22px] border border-zinc-200/80 bg-white text-zinc-900 shadow-[0_24px_80px_rgba(0,0,0,0.18)] outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-[0_24px_90px_rgba(0,0,0,0.65)]"
                >
                  <DialogPrimitive.Title className="sr-only">Search threads</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">Search and browse saved chat sessions</DialogPrimitive.Description>
        {/* Search */}
        <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-5 dark:border-white/[0.07]">
          <Search className="h-[18px] w-[18px] shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search chats and commands"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
        </div>

        {/* Results */}
        <div className="relative min-h-0 flex-1">
        <div className="sidebar-scroll max-h-[420px] space-y-0.5 overflow-y-auto p-2.5 pb-12">
          {flatItems.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center px-4 py-8 text-center select-none">
              <Search className="mb-2.5 h-5 w-5 text-zinc-300 dark:text-zinc-700" strokeWidth={1.7} />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No matching chats or commands</span>
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
              <div key={`${item.type}-${item.id}`}>
                {categoryHeader && (
                  <p className={cn('px-3 pb-1.5 text-[11px] font-medium text-zinc-400 select-none dark:text-zinc-600', index === 0 ? 'pt-1' : 'pt-3')}>
                    {categoryHeader}
                  </p>
                )}
                <div
                  data-index={index}
                  onClick={() => triggerAction(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex h-11 items-center justify-between rounded-lg px-3 cursor-pointer select-none font-normal",
                    isSelected
                      ? "bg-zinc-100 text-zinc-950 dark:bg-white/[0.07] dark:text-zinc-50"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.035] dark:hover:text-zinc-100"
                  )}
                >
                  {item.type === 'action' ? (
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center',
                        isSelected ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-500 dark:text-zinc-500',
                      )}>
                      {item.id === 'settings' ? (
                        <Settings className="h-3.5 w-3.5" strokeWidth={2.1} />
                      ) : (
                        <SquarePen className="h-3.5 w-3.5" strokeWidth={2.1} />
                      )}
                      </span>
                      <span className="truncate text-sm font-medium">{item.title}</span>
                    </div>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate pr-4 text-sm">{item.title}</span>
                      <span className={cn('shrink-0 text-[11px] font-normal', isSelected ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-600')}>
                        {getRelativeTime(item.updatedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 progressive-blur" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-9 items-center justify-end px-5 text-[11px] font-normal text-zinc-400 select-none dark:text-zinc-600">
          {totalCount} {totalCount === 1 ? 'thread' : 'threads'}
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
