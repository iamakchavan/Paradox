"use client";

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomToast } from '@/components/ui/custom-toast';

interface CopyMessageButtonProps {
  content: string;
}

export const CopyMessageButton = memo(({ content }: CopyMessageButtonProps) => {
  const { showToast } = useCustomToast();
  const [copied, setCopied] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      showToast({ message: 'Query copied to clipboard', type: 'success', mode: 'capsule' });

      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => {
        setCopied(false);
      }, 1400);
    } catch {
      showToast({ message: 'Could not copy query', type: 'error', mode: 'capsule' });
    }
  }, [content, showToast]);

  return (
    <button
      type="button"
      aria-label={copied ? 'Query copied' : 'Copy query'}
      onClick={() => void handleCopy()}
      className="relative flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color] duration-[var(--motion-duration-fast)] hover:bg-secondary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Copy
        className={cn(
          'absolute h-4 w-4 transition-[opacity,transform] duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)]',
          copied ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
        )}
      />
      <Check
        className={cn(
          'absolute h-4 w-4 text-emerald-500 transition-[opacity,transform] duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)]',
          copied ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        )}
      />
    </button>
  );
});

CopyMessageButton.displayName = 'CopyMessageButton';
