"use client";

import { useEffect, useRef, useState } from 'react';
import { useLibrary } from '@/hooks/use-library';
import type { LibraryFilter } from './types';

const LIBRARY_PAGE_SIZE = 16;

export function useLibraryBrowser() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<LibraryFilter>('all');
  const [visibleLimit, setVisibleLimit] = useState(LIBRARY_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const allFiles = useLibrary(query, typeFilter);
  const files = allFiles?.slice(0, visibleLimit);
  const hasMore = allFiles ? allFiles.length > visibleLimit : false;

  useEffect(() => {
    setVisibleLimit(LIBRARY_PAGE_SIZE);
  }, [query, typeFilter]);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleLimit((previous) => previous + LIBRARY_PAGE_SIZE);
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
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    files,
    hasMore,
    sentinelRef,
  };
}

export type LibraryBrowserController = ReturnType<typeof useLibraryBrowser>;
