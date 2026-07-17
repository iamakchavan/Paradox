"use client";

import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ChatSession } from '@/lib/db';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { MOTION_EASE_OUT } from '@/lib/motion';
import { usePreparedEntrance } from '@/hooks/use-prepared-entrance';
import {
  CommandPaletteRow,
  type CommandPaletteItem,
} from '@/components/chat/command-palette/CommandPaletteRow';
import {
  COMMAND_ACTIONS,
  COMMAND_ACTIONS_BY_ID,
} from '@/components/chat/command-palette/registry';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onNavigate: (href: string) => void;
}

const EXIT_CLEANUP_FALLBACK_MS = 400;
const EMPTY_CHATS: ChatSession[] = [];

export function CommandPalette({ isOpen, onClose, onOpenSettings, onNavigate }: CommandPaletteProps) {
  const reduceMotion = useReducedMotion();
  const entranceReady = usePreparedEntrance(isOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState<ChatSession[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isPointerNavigationEnabled, setIsPointerNavigationEnabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerNavigationEnabledRef = useRef(false);
  const chats = useLiveQuery(
    () => db.chats.orderBy('updatedAt').reverse().limit(50).toArray(),
    [],
  ) ?? EMPTY_CHATS;
  const totalCount = useLiveQuery(() => db.chats.count(), []) ?? 0;

  useLayoutEffect(() => {
    if (!isOpen) return;

    pointerNavigationEnabledRef.current = false;
    setIsPointerNavigationEnabled(false);
  }, [isOpen]);

  const enablePointerNavigation = useCallback(() => {
    if (pointerNavigationEnabledRef.current) return;

    pointerNavigationEnabledRef.current = true;
    setIsPointerNavigationEnabled(true);
  }, []);

  const highlightFromPointer = useCallback((index: number) => {
    if (!pointerNavigationEnabledRef.current) return;
    setSelectedIndex(index);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      return;
    }

    if (!isMounted) return;

    const timeout = window.setTimeout(
      () => setIsMounted(false),
      reduceMotion ? 0 : EXIT_CLEANUP_FALLBACK_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [isMounted, isOpen, reduceMotion]);

  // Reset transient palette state when it opens.
  useEffect(() => {
    if (!isOpen) return;

    setSearchQuery('');
    setSelectedIndex(0);

    // Focus input on open
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

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
    const items: CommandPaletteItem[] = [];
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

    todayList.forEach((c) => items.push({ type: 'chat', id: c.id, title: c.title, updatedAt: c.updatedAt ?? c.createdAt, createdAt: c.createdAt }));
    yesterdayList.forEach((c) => items.push({ type: 'chat', id: c.id, title: c.title, updatedAt: c.updatedAt ?? c.createdAt, createdAt: c.createdAt }));
    earlierList.forEach((c) => items.push({ type: 'chat', id: c.id, title: c.title, updatedAt: c.updatedAt ?? c.createdAt, createdAt: c.createdAt }));

    return items;
  }, [filteredChats, searchQuery]);

  useEffect(() => {
    setSelectedIndex((index) => {
      if (flatItems.length === 0) return 0;
      return Math.min(index, flatItems.length - 1);
    });
  }, [flatItems.length]);

  // Trigger select action
  const triggerAction = useCallback((index: number) => {
    const item = flatItems[index];
    if (!item) return;

    if (item.type === 'action') {
      const action = COMMAND_ACTIONS_BY_ID.get(item.id);
      if (!action) return;

      onClose();
      if (action.destination.type === 'settings') {
        requestAnimationFrame(() => onOpenSettings());
      } else {
        onNavigate(action.destination.href);
      }
    } else {
      onClose();
      onNavigate(`/chat/${item.id}`);
    }
  }, [flatItems, onClose, onNavigate, onOpenSettings]);

  // Radix handles Escape; this listener owns list navigation and selection.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (flatItems.length === 0) return;
        setSelectedIndex((previous) => (previous + 1) % flatItems.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (flatItems.length === 0) return;
        setSelectedIndex((previous) => (previous - 1 + flatItems.length) % flatItems.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        triggerAction(selectedIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flatItems.length, isOpen, selectedIndex, triggerAction]);

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

  const getCategory = (item: CommandPaletteItem) => {
    if (item.type === 'action') return 'Actions';
    if (item.updatedAt >= startOfToday.getTime()) return 'Today';
    if (item.updatedAt >= startOfYesterday.getTime()) return 'Yesterday';
    return 'Last 7 Days';
  };
  if (!isOpen && !isMounted) return null;

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal forceMount>
              {/* Backdrop Overlay */}
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  key="command-palette-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isOpen && entranceReady ? 1 : 0 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: MOTION_EASE_OUT }}
                  className={cn(
                    'fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] dark:bg-black/60',
                    !isOpen && 'pointer-events-none',
                  )}
                />
              </DialogPrimitive.Overlay>

              {/* Modal Content Card */}
              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  key="command-palette-content"
                  ref={containerRef}
                  onPointerMoveCapture={enablePointerNavigation}
                  initial={reduceMotion
                    ? { opacity: 0, x: '-50%' }
                    : { opacity: 0, scale: 0.975, x: '-50%', y: -10 }}
                  animate={isOpen && entranceReady
                    ? { opacity: 1, scale: 1, x: '-50%', y: 0 }
                    : reduceMotion
                    ? { opacity: 0, x: '-50%' }
                    : { opacity: 0, scale: 0.985, x: '-50%', y: -6 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: MOTION_EASE_OUT }}
                  onAnimationComplete={() => {
                    if (!isOpen) setIsMounted(false);
                  }}
                  style={{ transformOrigin: 'top center', willChange: 'transform, opacity' }}
                  className={cn(
                    'fixed left-1/2 top-[14dvh] z-50 flex w-[calc(100vw-2rem)] max-w-[620px] flex-col overflow-hidden rounded-[16px] border border-black/[0.09] bg-white/[0.92] text-zinc-900 shadow-[0_1px_0_rgba(255,255,255,0.92)_inset,0_16px_48px_rgba(0,0,0,0.18)] outline-none backdrop-blur-[28px] backdrop-saturate-[1.25] dark:border-white/[0.1] dark:bg-[hsl(var(--surface-panel)/0.95)] dark:text-zinc-100 dark:shadow-[0_1px_0_rgba(255,255,255,0.055)_inset,0_22px_64px_rgba(0,0,0,0.58)]',
                    !isOpen && 'pointer-events-none',
                  )}
                >
                  <DialogPrimitive.Title className="sr-only">Search threads</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">Search and browse saved chat sessions</DialogPrimitive.Description>
        {/* Search */}
        <div className="relative flex h-[52px] items-center gap-2.5 border-b border-black/[0.065] px-4 dark:border-white/[0.075]">
          <Search className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.9} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search chats and commands"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="min-w-0 flex-1 border-none bg-transparent text-[14px] font-normal tracking-normal text-zinc-900 outline-none placeholder:text-zinc-400/90 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
        </div>

        {/* Results */}
        <div className="relative min-h-0 flex-1">
        <div className="sidebar-scroll max-h-[min(420px,calc(100dvh-150px))] space-y-px overflow-y-auto px-1.5 pb-10 pt-1.5">
          {flatItems.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center px-4 py-8 text-center select-none">
              <Search className="mb-3 h-5 w-5 text-zinc-300 dark:text-zinc-700" strokeWidth={1.6} />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No matching chats or commands</span>
            </div>
          ) : flatItems.map((item, index) => {
            const isSelected = selectedIndex === index;
            const category = getCategory(item);
            const previousCategory = index > 0 ? getCategory(flatItems[index - 1]) : null;
            const categoryHeader = category !== previousCategory ? category : null;

            return (
              <div key={`${item.type}-${item.id}`}>
                {categoryHeader && (
                  <p className={cn('select-none px-3 pb-1 text-[10.5px] font-medium text-zinc-400/90 dark:text-zinc-600', index === 0 ? 'pt-1' : 'pt-2.5')}>
                    {categoryHeader}
                  </p>
                )}
                <CommandPaletteRow
                  item={item}
                  index={index}
                  isSelected={isSelected}
                  reduceMotion={Boolean(reduceMotion)}
                  isPointerNavigationEnabled={isPointerNavigationEnabled}
                  onSelect={() => triggerAction(index)}
                  onHighlight={() => highlightFromPointer(index)}
                />
              </div>
            );
          })}
        </div>

        <div className="command-palette-footer-blur pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-8 select-none items-center justify-end px-4 text-[10.5px] font-normal text-zinc-400 dark:text-zinc-600">
          {totalCount} {totalCount === 1 ? 'thread' : 'threads'}
        </div>
        </div>

          </motion.div>
              </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
