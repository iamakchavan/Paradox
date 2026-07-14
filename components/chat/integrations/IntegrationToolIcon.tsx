"use client";

import { Puzzle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROVIDER_LOGOS } from './provider-catalog';

export function IntegrationToolIcon({
  integrationId,
  className,
}: {
  integrationId: string;
  className?: string;
}) {
  const ProviderIcon = PROVIDER_LOGOS[integrationId] ?? Puzzle;

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100/80 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
        className,
      )}
    >
      <ProviderIcon className="h-4 w-4" />
    </span>
  );
}
