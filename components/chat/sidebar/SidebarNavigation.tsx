"use client";

import { Folder, Puzzle, Search } from 'lucide-react';
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
};

function NewChatIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 text-foreground/50"
    >
      <path d="M11.4875 0.512563C10.804 -0.170854 9.696 -0.170854 9.01258 0.512563L4.75098 4.77417C4.49563 5.02951 4.29308 5.33265 4.15488 5.66628L3.30712 7.71282C3.19103 7.99307 3.25519 8.31566 3.46968 8.53017C3.68417 8.74467 4.00676 8.80885 4.28702 8.69277L6.33382 7.84501C6.66748 7.70681 6.97066 7.50423 7.22604 7.24886L11.4875 2.98744C12.1709 2.30402 12.1709 1.19598 11.4875 0.512563Z" fill="currentColor" />
      <path d="M2.75 1.5C2.05964 1.5 1.5 2.05964 1.5 2.75V9.25C1.5 9.94036 2.05964 10.5 2.75 10.5H9.25C9.94036 10.5 10.5 9.94036 10.5 9.25V7C10.5 6.58579 10.8358 6.25 11.25 6.25C11.6642 6.25 12 6.58579 12 7V9.25C12 10.7688 10.7688 12 9.25 12H2.75C1.23122 12 0 10.7688 0 9.25V2.75C0 1.23122 1.23122 4.84288e-08 2.75 4.84288e-08H5C5.41421 4.84288e-08 5.75 0.335786 5.75 0.75C5.75 1.16421 5.41421 1.5 5 1.5H2.75Z" fill="currentColor" />
    </svg>
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
  hasChats,
}: SidebarNavigationProps) {
  return (
    <div className="p-3 space-y-1 select-none flex-shrink-0">
      <button
        onClick={onSearchClick}
        className={cn(
          "w-full h-[36px] px-3 rounded-lg flex items-center gap-2.5 text-[13px] font-medium transition-[background-color,color,border-color,box-shadow] duration-[var(--motion-duration-fast)] cursor-pointer border",
          isSearchActive
            ? "bg-white dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800/60 shadow-sm text-foreground font-semibold"
            : "bg-foreground/[0.02] border-transparent text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05]"
        )}
      >
        <Search className="w-4 h-4 text-foreground/50 flex-shrink-0" strokeWidth={2.2} />
        <span>Search</span>
      </button>

      <button
        onClick={onNewChat}
        className="w-full h-[36px] px-3 rounded-lg flex items-center gap-2.5 text-[13px] font-medium border border-transparent text-foreground/60 hover:text-foreground hover:bg-foreground/[0.04] transition-[background-color,color] duration-[var(--motion-duration-fast)] cursor-pointer"
      >
        <NewChatIcon />
        <span>New Chat</span>
      </button>

      {hasChats && (
        <button
          onClick={onLibraryClick}
          className={cn(
            "w-full h-[36px] px-3 rounded-lg flex items-center gap-2.5 text-[13px] font-medium transition-[background-color,color,border-color,box-shadow] duration-[var(--motion-duration-fast)] cursor-pointer border",
            isLibraryActive
              ? "bg-white dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800/60 shadow-sm text-foreground font-semibold"
              : "border-transparent text-foreground/65 hover:text-foreground hover:bg-foreground/[0.04]"
          )}
        >
          <Folder className="w-4 h-4 text-foreground/50 flex-shrink-0" strokeWidth={2.2} />
          <span>Library</span>
        </button>
      )}

      <button
        onClick={onIntegrationsClick}
        className={cn(
          "w-full h-[36px] px-3 rounded-lg flex items-center gap-2.5 text-[13px] font-medium transition-[background-color,color,border-color,box-shadow] duration-[var(--motion-duration-fast)] cursor-pointer border",
          isIntegrationsActive
            ? "bg-white dark:bg-zinc-900 border-zinc-200/50 dark:border-zinc-800/60 shadow-sm text-foreground font-semibold"
            : "border-transparent text-foreground/65 hover:text-foreground hover:bg-foreground/[0.04]"
        )}
      >
        <Puzzle className="w-4 h-4 text-foreground/50 flex-shrink-0" strokeWidth={2.2} />
        <span>Apps &amp; Tools</span>
      </button>
    </div>
  );
}
