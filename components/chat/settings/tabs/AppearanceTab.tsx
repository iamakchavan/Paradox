"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppearanceTab() {
  const { resolvedTheme, setTheme } = useTheme();
  const [localDark, setLocalDark] = useState(false);

  useEffect(() => {
    setLocalDark(resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const handleThemeToggle = (newVal: boolean) => {
    setLocalDark(newVal);
    setTimeout(() => {
      setTheme(newVal ? 'dark' : 'light');
    }, 150);
  };

  return (
    <div className="space-y-2">
      <p className="text-[12px] font-medium text-foreground/45 px-0.5 pb-1">
        Theme
      </p>

      <div className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/35 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-foreground/[0.04] dark:bg-white/[0.05] text-foreground/55 flex items-center justify-center flex-shrink-0">
              <Moon className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-foreground leading-5">Dark Mode</span>
              <span className="mt-0.5 block text-[11px] text-foreground/45 leading-4">
                Reduce eye strain in low-light environments
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleThemeToggle(!localDark)}
            aria-checked={localDark}
            role="switch"
            aria-label="Dark mode"
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-0 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              localDark ? 'bg-zinc-600 dark:bg-zinc-500' : 'bg-zinc-300 dark:bg-zinc-700'
            )}
          >
            <span
              className={cn(
                'pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
                localDark ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
