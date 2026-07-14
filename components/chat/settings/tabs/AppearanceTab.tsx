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
    <section>
      <div className="mb-4">
        <h3 className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">Color scheme</h3>
        <p className="mt-1 text-[11px] leading-4 text-zinc-400 dark:text-zinc-600">Choose how Paradox appears on this device.</p>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-zinc-200/70 bg-zinc-50/40 dark:border-white/[0.08] dark:bg-white/[0.025]">
        <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-950/[0.05] dark:bg-white/[0.06] dark:text-zinc-400 dark:shadow-none dark:ring-white/[0.05]">
              <Moon className="h-4 w-4" strokeWidth={1.9} />
            </div>
            <div className="min-w-0">
              <span className="block text-[13px] font-semibold leading-5 text-zinc-900 dark:text-zinc-100">Dark mode</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-zinc-400 dark:text-zinc-600">
                Use a darker interface in low-light environments
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
              localDark ? 'bg-zinc-900 dark:bg-zinc-200' : 'bg-zinc-300 dark:bg-zinc-700'
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
    </section>
  );
}
