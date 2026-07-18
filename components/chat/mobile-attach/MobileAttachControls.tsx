"use client";

import { Puzzle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getProviderPresentation,
  PROVIDER_LOGOS,
} from '@/components/chat/integrations/provider-catalog';
import type { MCPIntegration } from '@/lib/db';

export function SwitchPill({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-out',
        checked ? 'bg-foreground' : 'bg-zinc-300 dark:bg-zinc-700'
      )}
    >
      <span className={cn(
        'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-200 ease-out',
        checked && 'translate-x-5'
      )} />
    </span>
  );
}

export function ActionTile({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[92px] min-w-[116px] flex-1 flex-col justify-center rounded-[24px] bg-foreground/[0.055] px-4 text-left transition-colors active:bg-foreground/[0.09] dark:bg-white/[0.055] dark:active:bg-white/[0.09]"
    >
      <span className="mb-3 flex h-6 w-6 items-center justify-center text-foreground/68 dark:text-foreground/76">{icon}</span>
      <span className="text-[15px] font-medium leading-tight text-foreground">{label}</span>
    </button>
  );
}

export function OptionRow({
  icon,
  label,
  checked,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[54px] w-full items-center justify-between gap-4 rounded-2xl px-2 text-left [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-foreground/62">{icon}</span>
        <span className="truncate text-[15px] font-medium leading-tight text-foreground">{label}</span>
      </span>
      <SwitchPill checked={checked} />
    </button>
  );
}

export function AppToggleRow({
  app,
  selected,
  onToggle,
}: {
  app: MCPIntegration;
  selected: boolean;
  onToggle: () => void;
}) {
  const AppIcon = PROVIDER_LOGOS[app.id] || Puzzle;
  const isCustom = !PROVIDER_LOGOS[app.id];
  const presentation = getProviderPresentation(app);
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex min-h-[56px] w-full items-center justify-between gap-4 rounded-2xl px-3.5 text-left [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
    >
      <span className="flex min-w-0 items-center gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center">
          {isCustom ? (
            <AppIcon className="h-4 w-4 text-foreground/65" strokeWidth={1.7} />
          ) : (
            <AppIcon className="h-4 w-4" />
          )}
        </span>
        <span className="truncate text-[15px] font-medium text-foreground">
          {presentation.name}
        </span>
      </span>
      <SwitchPill checked={selected} />
    </button>
  );
}
