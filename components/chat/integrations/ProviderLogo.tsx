"use client";

import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

export function ProviderLogo({
  icon: Icon,
  variant = 'list',
  className,
}: {
  icon: ComponentType;
  variant?: 'list' | 'dialog';
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden [&>img]:block [&>img]:object-contain [&>svg]:block',
        variant === 'dialog'
          ? 'h-9 w-9 rounded-xl bg-zinc-100/80 text-zinc-700 [&>img]:h-[18px] [&>img]:w-[18px] [&>svg]:h-[18px] [&>svg]:w-[18px] dark:bg-zinc-900 dark:text-zinc-300'
          : 'h-9 w-9 [&>img]:h-7 [&>img]:w-7 [&>svg]:h-7 [&>svg]:w-7',
        className,
      )}
    >
      <Icon />
    </span>
  );
}
