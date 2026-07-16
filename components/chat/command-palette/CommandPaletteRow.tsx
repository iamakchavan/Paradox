"use client";

import { motion } from 'framer-motion';
import { Settings, SquarePen } from 'lucide-react';
import { MOTION_EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type CommandPaletteItem =
  | { type: 'action'; id: 'new-chat' | 'settings'; title: string }
  | { type: 'chat'; id: string; title: string; updatedAt: number; createdAt: number };

interface CommandPaletteRowProps {
  item: CommandPaletteItem;
  index: number;
  isSelected: boolean;
  reduceMotion: boolean;
  isPointerNavigationEnabled: boolean;
  onSelect: () => void;
  onHighlight: () => void;
}

function getRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 36) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return `${days} days ago`;
}

export function CommandPaletteRow({
  item,
  index,
  isSelected,
  reduceMotion,
  isPointerNavigationEnabled,
  onSelect,
  onHighlight,
}: CommandPaletteRowProps) {
  return (
    <button
      type="button"
      data-index={index}
      tabIndex={-1}
      aria-label={item.title}
      aria-current={isSelected ? 'true' : undefined}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      onMouseEnter={onHighlight}
      onPointerMove={onHighlight}
      className={cn(
        'group relative flex h-10 w-full cursor-pointer select-none items-center justify-between overflow-hidden rounded-lg px-3 text-left outline-none',
        'text-zinc-600 transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] dark:text-zinc-400',
        !isSelected && isPointerNavigationEnabled && 'hover:text-zinc-900 dark:hover:text-zinc-100',
        isSelected && 'text-zinc-950 dark:text-zinc-50',
      )}
    >
      {isSelected && (
        <motion.span
          layoutId="command-palette-selection"
          className="pointer-events-none absolute inset-0 rounded-lg bg-black/[0.06] dark:bg-white/[0.09]"
          transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: MOTION_EASE_OUT }}
        />
      )}

      {item.type === 'action' ? (
        <div className="relative z-10 flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              'flex h-[18px] w-[18px] shrink-0 items-center justify-center transition-colors duration-[var(--motion-duration-fast)]',
              isSelected ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-500',
            )}
          >
            {item.id === 'settings' ? (
              <Settings className="h-[14px] w-[14px]" strokeWidth={1.9} />
            ) : (
              <SquarePen className="h-[14px] w-[14px]" strokeWidth={1.9} />
            )}
          </span>
          <span className="truncate text-[13px] font-medium">{item.title}</span>
        </div>
      ) : (
        <>
          <span className="relative z-10 min-w-0 flex-1 truncate pr-4 text-[13px] font-normal">
            {item.title}
          </span>
          <span
            className={cn(
              'relative z-10 shrink-0 text-[10.5px] font-normal transition-colors duration-[var(--motion-duration-fast)]',
              isSelected ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400/90 dark:text-zinc-600',
            )}
          >
            {getRelativeTime(item.updatedAt)}
          </span>
        </>
      )}
    </button>
  );
}
