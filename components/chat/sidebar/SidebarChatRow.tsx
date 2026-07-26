"use client";

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Edit3, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MOTION_EASE_OUT } from '@/lib/motion';
import type { ChatSession } from '@/lib/db';

interface SidebarChatRowProps {
  chat: ChatSession;
  isActive: boolean;
  highlighted: boolean;
  reduceMotion: boolean;
  onHighlight: (chatId: string) => void;
  onSelectChat: (chatId: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onDeleteChat: (id: string) => void;
}

export const SidebarChatRow = memo(function SidebarChatRow({
  chat,
  isActive,
  highlighted,
  reduceMotion,
  onHighlight,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
}: SidebarChatRowProps) {
  return (
    <div
      onClick={() => onSelectChat(chat.id)}
      onMouseEnter={() => onHighlight(chat.id)}
      className={cn(
        "group relative flex h-[34px] w-full cursor-pointer select-none items-center justify-between overflow-hidden rounded-lg px-2.5 text-[12.5px] transition-[background-color,color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]",
        isActive
          ? "bg-foreground/[0.065] font-medium text-foreground"
          : "text-foreground/60 hover:text-foreground/86"
      )}
    >
      {highlighted && (
        <motion.span
          layoutId="sidebar-history-highlight"
          className="pointer-events-none absolute inset-0 rounded-lg bg-foreground/[0.035]"
          transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: MOTION_EASE_OUT }}
        />
      )}

      <span className="relative z-10 min-w-0 flex-1 truncate pr-1">{chat.title}</span>

      <div className="relative z-10 flex flex-shrink-0 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              className={cn(
                "opacity-100 md:opacity-0 md:group-hover:opacity-100 data-[state=open]:opacity-100 transition-[opacity,background-color,color] duration-[var(--motion-duration-fast)]",
                "flex h-6 w-6 items-center justify-center rounded-md text-foreground/38 hover:bg-foreground/[0.055] hover:text-foreground/75"
              )}
              title="More options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className="w-40 rounded-xl border border-foreground/[0.08] bg-popover/98 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur-md dark:shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
          >
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                onRenameChat(chat.id, chat.title);
              }}
              className="flex h-9 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium text-foreground/78 transition-colors hover:bg-foreground/[0.05] focus:bg-foreground/[0.05]"
            >
              <Edit3 className="h-4 w-4 text-foreground/52" strokeWidth={1.9} />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(event) => {
                event.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className="flex h-9 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-500/[0.08] focus:bg-red-500/[0.08] focus:text-red-500"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.9} />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

SidebarChatRow.displayName = 'SidebarChatRow';
