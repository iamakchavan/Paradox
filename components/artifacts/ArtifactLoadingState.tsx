"use client";

import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  label?: string;
}

export function ArtifactLoadingState({
  className,
  label = 'Loading report',
}: Props) {
  return (
    <div
      className={cn('flex min-h-[240px] w-full items-center justify-center', className)}
      role="status"
      aria-label={label}
    >
      <Spinner />
      <span className="sr-only">{label}</span>
    </div>
  );
}
