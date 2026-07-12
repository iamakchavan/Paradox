"use client";

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ModelConfig } from '@/lib/models';
import { ModelLogo } from './model-branding';

export function ModelSelectorTrigger({
  triggerRef,
  activeModel,
  isOpen,
  isLoading,
  minimal,
  onToggle,
}: {
  triggerRef: React.RefObject<HTMLButtonElement>;
  activeModel: ModelConfig;
  isOpen: boolean;
  isLoading: boolean;
  minimal: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      ref={triggerRef}
      variant={minimal ? 'ghost' : 'outline'}
      onClick={onToggle}
      className={cn(
        minimal
          ? 'h-9 md:h-10 rounded-full px-3 flex items-center gap-1.5 hover:bg-zinc-200/50 dark:hover:bg-white/5 text-xs font-semibold bg-transparent transition-all duration-200 shadow-none border-0 shrink-0 select-none text-zinc-800 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-zinc-50 hover:scale-105 active:scale-95'
          : 'h-8 sm:h-9 rounded-full px-3.5 py-2 flex items-center gap-1.5 border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-white/5 text-xs font-medium bg-background/50 backdrop-blur-xs transition-all duration-200 shadow-2xs',
        isOpen && (minimal ? 'text-zinc-950 dark:text-zinc-50' : 'bg-zinc-200/55 dark:bg-white/10 text-zinc-950 dark:text-zinc-50')
      )}
      disabled={isLoading}
    >
      <ModelLogo provider={activeModel.provider} modelId={activeModel.id} className="size-4 rounded-xs shrink-0" size={16} />
      <span className="font-sans tracking-tight truncate max-w-[85px] sm:max-w-[130px] align-middle font-medium">
        {activeModel.name}
      </span>
      <ChevronDown
        className="w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ease-out"
        style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
      />
    </Button>
  );
}
