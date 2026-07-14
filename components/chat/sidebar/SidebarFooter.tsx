"use client";

import { Moon, Settings, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface SidebarFooterProps {
  isSettingsActive: boolean;
  onSettingsClick?: () => void;
}

export function SidebarFooter({ isSettingsActive, onSettingsClick }: SidebarFooterProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none flex items-end justify-center gap-2 pb-4 z-20">
      <div className="absolute inset-0 progressive-blur pointer-events-none" />
      <button
        onClick={onSettingsClick}
        className={cn(
          "pointer-events-auto h-[34px] px-3.5 rounded-full liquid-glass-dock flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer relative z-10 active:scale-[0.96] motion-reduce:transform-none text-foreground/70 hover:text-foreground",
          isSettingsActive && "text-foreground ring-1 ring-foreground/10"
        )}
      >
        <Settings className="w-3.5 h-3.5 text-foreground/50 flex-shrink-0" strokeWidth={2.2} />
        <span>Settings</span>
      </button>

      <button
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="pointer-events-auto w-[34px] h-[34px] rounded-full liquid-glass-dock flex items-center justify-center cursor-pointer relative z-10 active:scale-[0.96] motion-reduce:transform-none text-foreground/70 hover:text-foreground"
        title="Toggle theme"
      >
        <Sun className="sidebar-theme-icon h-[14px] w-[14px] flex-shrink-0 opacity-100 dark:opacity-0" strokeWidth={2.2} />
        <Moon className="sidebar-theme-icon absolute h-[14px] w-[14px] flex-shrink-0 opacity-0 dark:opacity-100" strokeWidth={2.2} />
        <span className="sr-only">Toggle theme</span>
      </button>
    </div>
  );
}
