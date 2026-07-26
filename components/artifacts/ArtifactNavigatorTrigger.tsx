"use client";

import { cn } from '@/lib/utils';
import { ArtifactLibraryIcon } from './ArtifactLibraryIcon';

interface Props {
  count: number;
  isActive: boolean;
  onClick: () => void;
  compact?: boolean;
  className?: string;
}

export function ArtifactNavigatorTrigger({
  count,
  isActive,
  onClick,
  compact = false,
  className,
}: Props) {
  if (count === 0) return null;
  const label = `${count} ${count === 1 ? 'artifact' : 'artifacts'}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full text-foreground/75 transition-[background-color,color,transform] duration-200 hover:bg-zinc-200/50 hover:text-foreground active:scale-[0.96] dark:hover:bg-white/5 motion-reduce:transform-none md:h-10',
        compact ? 'relative w-9 px-0 md:h-9' : 'px-3',
        isActive && 'bg-zinc-200/60 text-foreground dark:bg-white/10',
        className,
      )}
      aria-label={`Open ${label}`}
      aria-expanded={isActive}
      title={label}
    >
      <ArtifactLibraryIcon className="h-4 w-4" />
      {!compact && (
        <>
          <span className="text-xs font-medium">Artifacts</span>
          <span className="min-w-3 text-center text-[10px] font-semibold tabular-nums text-foreground/55">
            {count}
          </span>
        </>
      )}
      {compact && (
        <span className="absolute right-0 top-0 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-foreground px-0.5 text-[8px] font-semibold leading-none tabular-nums text-background">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
