"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ChatSession } from '@/lib/db';
import type { GroupedChats } from './types';

const PAGE_SIZE = 20;

function groupChatsByDate(chats: ChatSession[] | undefined): GroupedChats {
  const groups: GroupedChats = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };
  if (!chats) return groups;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  chats.forEach((chat) => {
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
}

export function useSidebarHistory() {
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const totalChatCount = useLiveQuery(() => db.chats.count());

  const chats = useLiveQuery(
    () => db.chats.toArray().then((items) => {
      const sorted = items.sort((a, b) => {
        const timeA = a.updatedAt ?? a.createdAt;
        const timeB = b.updatedAt ?? b.createdAt;
        return timeB - timeA;
      });

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return sorted
          .filter((chat) => chat.title.toLowerCase().includes(query))
          .slice(0, visibleLimit);
      }

      return sorted.slice(0, visibleLimit);
    }),
    [visibleLimit, searchQuery]
  );

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [searchQuery]);

  const groupedChats = useMemo(() => groupChatsByDate(chats), [chats]);
  const hasChats = totalChatCount !== undefined && totalChatCount > 0;
  const hasMore = chats ? chats.length === visibleLimit : false;

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleLimit((previous) => previous + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [hasMore]);

  return {
    chats,
    groupedChats,
    totalChatCount,
    hasChats,
    hasMore,
    searchQuery,
    setSearchQuery,
    sentinelRef,
  };
}

export type SidebarHistoryController = ReturnType<typeof useSidebarHistory>;
