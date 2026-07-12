"use client";

import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ComposerSubmitButton({
  expanded,
  isLoading,
  isSendDisabled,
  onStop,
  onSubmit,
}: {
  expanded: boolean;
  isLoading: boolean;
  isSendDisabled: boolean;
  onStop: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className={cn(
      'flex items-center shrink-0',
      expanded ? 'absolute bottom-2 right-2.5 h-9 gap-1.5 sm:gap-2' : 'gap-1.5 sm:gap-2 self-center',
    )}>
      {isLoading ? (
        <Button
          onClick={onStop}
          onMouseDown={event => event.preventDefault()}
          size="icon"
          className="h-9 w-9 rounded-full bg-foreground text-background hover:bg-foreground/95 hover:scale-105 active:scale-[0.93] active:duration-75 shrink-0 flex items-center justify-center transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out"
          title="Stop streaming"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={isSendDisabled}
          onMouseDown={event => event.preventDefault()}
          size="icon"
          className={cn(
            'h-9 w-9 rounded-full shrink-0 flex items-center justify-center transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out',
            isSendDisabled
              ? 'bg-zinc-200/50 dark:bg-zinc-800/40 text-muted-foreground/35 cursor-not-allowed'
              : 'bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 hover:scale-105 active:scale-[0.93] active:duration-75 shadow-sm shadow-cyan-500/10',
          )}
          title="Send message"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5px]" />
        </Button>
      )}
    </div>
  );
}
