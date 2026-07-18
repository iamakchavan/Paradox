"use client";

import { useCallback, useState } from 'react';
import { useMobileBackDismiss } from '@/hooks/use-mobile-back-dismiss';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import styles from './ArtifactTitlePill.module.css';

interface ArtifactTitlePillProps {
  title: string;
  status: 'streaming' | 'complete' | 'failed';
  isMobile: boolean;
}

export function ArtifactTitlePill({ title, status, isMobile }: ArtifactTitlePillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const reportType = status === 'streaming' ? 'Writing report...' : 'Deep research report';

  const { runAfterHistoryDismiss } = useMobileBackDismiss({
    isOpen,
    isMobile,
    stateKey: 'paradoxArtifactTitle',
    entryPrefix: 'artifact-title',
    onDismiss: () => setIsOpen(false),
  });

  const dismiss = useCallback(() => {
    runAfterHistoryDismiss(() => setIsOpen(false));
  }, [runAfterHistoryDismiss]);

  const titlePillClass =
    'liquid-glass-dock relative h-10 w-full min-w-0 overflow-hidden rounded-full px-4';

  if (isMobile) {
    return (
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsOpen(true);
          } else {
            dismiss();
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`${titlePillClass} text-left transition-transform duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] active:scale-[0.98] motion-reduce:transform-none`}
            aria-label={`Show full report title: ${title}`}
          >
            <span className="flex h-full min-w-0 items-center">
              <span className="-translate-y-px truncate text-[13px] font-medium leading-[18px] text-foreground/90">
                {title}
              </span>
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={8}
          collisionPadding={16}
          onOpenAutoFocus={(event) => event.preventDefault()}
          motionPreset="none"
          className={`${styles.content} liquid-glass-dock z-[80] w-[min(22rem,calc(100vw-2rem))] rounded-[20px] px-4 py-3`}
        >
          <p className="text-sm font-medium leading-5 text-foreground/90">{title}</p>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{reportType}</p>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={`${titlePillClass} group`}>
      <div className="absolute inset-0 flex items-center px-4 transition-[transform,opacity] duration-200 ease-out group-hover:-translate-y-2 group-hover:opacity-0 motion-reduce:transition-none">
        <p className="-translate-y-px truncate text-[13px] font-medium leading-[18px] text-foreground/90">
          {title}
        </p>
      </div>
      <div className="absolute inset-0 flex translate-y-2 flex-col justify-center px-4 opacity-0 transition-[transform,opacity] duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none">
        <p className="truncate text-xs font-medium leading-[14px] text-foreground/90">{title}</p>
        <p className="truncate text-[10px] leading-3 text-muted-foreground/90">{reportType}</p>
      </div>
    </div>
  );
}
