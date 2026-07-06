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
      {/* Section heading */}
      <p className="text-[11px] font-semibold text-foreground/40 uppercase tracking-widest px-0.5 pb-1">
        Theme
      </p>

      <div className="bg-zinc-50/40 dark:bg-zinc-950/45 border border-zinc-200/40 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm">
        {/* Dark Mode Toggle Row */}
        <div className="flex items-center justify-between px-5 py-4 bg-zinc-100/5 dark:bg-zinc-950/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors duration-150">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-200/40 dark:bg-zinc-900/60 rounded-xl">
              <Moon className="h-4 w-4 text-violet-500 dark:text-violet-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Dark Mode</span>
              <span className="text-[11px] text-foreground/45 mt-0.5">
                Reduce eye strain in low-light environments
              </span>
            </div>
          </div>

          {/* iOS-style toggle */}
          <button
            type="button"
            onClick={() => handleThemeToggle(!localDark)}
            aria-label="Toggle dark mode"
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              localDark ? 'bg-cyan-600 dark:bg-cyan-500' : 'bg-zinc-300 dark:bg-zinc-700'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                localDark ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
