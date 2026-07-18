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
          ? 'h-11 w-11 rounded-[14px] border border-zinc-200/70 bg-zinc-50 text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] [&>img]:h-6 [&>img]:w-6 [&>svg]:h-6 [&>svg]:w-6 dark:border-white/[0.08] dark:bg-white/[0.045] dark:text-zinc-200 dark:shadow-none'
          : 'h-9 w-9 [&>img]:h-7 [&>img]:w-7 [&>svg]:h-7 [&>svg]:w-7',
        className,
      )}
    >
      <Icon />
    </span>
  );
}
