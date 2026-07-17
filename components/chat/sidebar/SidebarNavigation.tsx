"use client";

import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Folder, Puzzle, Search } from 'lucide-react';
import { MOTION_EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { SidebarProps } from './types';

type SidebarNavigationProps = Pick<
  SidebarProps,
  | 'onNewChat'
  | 'isSearchActive'
  | 'onSearchClick'
  | 'isLibraryActive'
  | 'onLibraryClick'
  | 'isIntegrationsActive'
  | 'onIntegrationsClick'
> & {
  hasChats: boolean;
  isNewChatActive: boolean;
};

function NewChatIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 flex-shrink-0"
    >
      <path d="M11.4875 0.512563C10.804 -0.170854 9.696 -0.170854 9.01258 0.512563L4.75098 4.77417C4.49563 5.02951 4.29308 5.33265 4.15488 5.66628L3.30712 7.71282C3.19103 7.99307 3.25519 8.31566 3.46968 8.53017C3.68417 8.74467 4.00676 8.80885 4.28702 8.69277L6.33382 7.84501C6.66748 7.70681 6.97066 7.50423 7.22604 7.24886L11.4875 2.98744C12.1709 2.30402 12.1709 1.19598 11.4875 0.512563Z" fill="currentColor" />
      <path d="M2.75 1.5C2.05964 1.5 1.5 2.05964 1.5 2.75V9.25C1.5 9.94036 2.05964 10.5 2.75 10.5H9.25C9.94036 10.5 10.5 9.94036 10.5 9.25V7C10.5 6.58579 10.8358 6.25 11.25 6.25C11.6642 6.25 12 6.58579 12 7V9.25C12 10.7688 10.7688 12 9.25 12H2.75C1.23122 12 0 10.7688 0 9.25V2.75C0 1.23122 1.23122 4.84288e-08 2.75 4.84288e-08H5C5.41421 4.84288e-08 5.75 0.335786 5.75 0.75C5.75 1.16421 5.41421 1.5 5 1.5H2.75Z" fill="currentColor" />
    </svg>
  );
}

function SidebarNavItem({
  itemId,
  icon,
  label,
  onClick,
  active = false,
  highlighted,
  reduceMotion,
  onHighlight,
}: {
  itemId: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  highlighted: boolean;
  reduceMotion: boolean;
  onHighlight: (itemId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHighlight(itemId)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex h-9 w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg border px-3 text-left text-[13px] font-medium outline-none transition-[background-color,color,border-color,box-shadow] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] focus-visible:ring-2 focus-visible:ring-foreground/15',
        active
          ? 'border-black/[0.065] bg-white text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.035)] dark:border-white/[0.065] dark:bg-white/[0.075] dark:shadow-none'
          : 'border-transparent text-foreground/62 hover:text-foreground/88',
      )}
    >
      {highlighted && (
        <motion.span
          layoutId="sidebar-navigation-highlight"
          className="pointer-events-none absolute inset-0 rounded-lg bg-foreground/[0.04]"
          transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: MOTION_EASE_OUT }}
        />
      )}
      <span
        className={cn(
          'relative z-10 flex h-4 w-4 shrink-0 items-center justify-center transition-colors duration-[var(--motion-duration-fast)]',
          active
            ? 'text-foreground/78'
            : 'text-foreground/45 group-hover:text-foreground/68',
        )}
      >
        {icon}
      </span>
      <span className="relative z-10 min-w-0 truncate">{label}</span>
    </button>
  );
}

export function SidebarNavigation({
  onNewChat,
  isSearchActive,
  onSearchClick,
  isLibraryActive,
  onLibraryClick,
  isIntegrationsActive,
  onIntegrationsClick,
  isNewChatActive,
  hasChats,
}: SidebarNavigationProps) {
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <nav
      className="flex flex-shrink-0 select-none flex-col gap-0.5 px-3 pb-2 pt-0.5"
      aria-label="Primary navigation"
      onMouseLeave={() => setHighlightedItemId(null)}
    >
      <SidebarNavItem
        itemId="search"
        icon={<Search className="h-4 w-4" strokeWidth={2} />}
        label="Search"
        onClick={onSearchClick}
        active={isSearchActive}
        highlighted={highlightedItemId === 'search'}
        reduceMotion={reduceMotion}
        onHighlight={setHighlightedItemId}
      />

      <SidebarNavItem
        itemId="new-chat"
        icon={<NewChatIcon />}
        label="New Chat"
        onClick={onNewChat}
        active={isNewChatActive}
        highlighted={highlightedItemId === 'new-chat'}
        reduceMotion={reduceMotion}
        onHighlight={setHighlightedItemId}
      />

      {hasChats && (
        <SidebarNavItem
          itemId="library"
          icon={<Folder className="h-4 w-4" strokeWidth={2} />}
          label="Library"
          onClick={onLibraryClick}
          active={isLibraryActive}
          highlighted={highlightedItemId === 'library'}
          reduceMotion={reduceMotion}
          onHighlight={setHighlightedItemId}
        />
      )}

      <SidebarNavItem
        itemId="apps-tools"
        icon={<Puzzle className="h-4 w-4" strokeWidth={2} />}
        label="Apps & Tools"
        onClick={onIntegrationsClick}
        active={isIntegrationsActive}
        highlighted={highlightedItemId === 'apps-tools'}
        reduceMotion={reduceMotion}
        onHighlight={setHighlightedItemId}
      />
    </nav>
  );
}
