'use client';

import { Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { motionTransitions } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { DeepResearchIcon, WebSearchIcon } from '../icons';
import type {
  ComposerCommandDefinition,
  ComposerMode,
} from './registry';

interface ComposerCommandMenuProps {
  isOpen: boolean;
  listboxId: string;
  commands: ComposerCommandDefinition[];
  activeCommandId: string | null;
  activeMode: ComposerMode | null;
  onActiveCommandChange: (commandId: string) => void;
  onSelectCommand: (command: ComposerCommandDefinition) => void;
}

function CommandIcon({ mode, className }: { mode: ComposerMode; className?: string }) {
  return mode === 'search'
    ? <WebSearchIcon className={className} />
    : <DeepResearchIcon className={className} />;
}

export function ComposerCommandMenu({
  isOpen,
  listboxId,
  commands,
  activeCommandId,
  activeMode,
  onActiveCommandChange,
  onSelectCommand,
}: ComposerCommandMenuProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="composer-command-menu"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.99 }}
          transition={motionTransitions.popover}
          className="absolute inset-x-3 z-0 origin-bottom"
          style={{ bottom: 'calc(100% - 24px)' }}
        >
          <div
            id={listboxId}
            role="listbox"
            aria-label="Composer commands"
            className="max-h-[min(254px,40dvh)] overflow-y-auto overscroll-contain rounded-t-[20px] border border-foreground/[0.09] bg-popover p-1.5 pb-[30px] shadow-[0_-10px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_-12px_36px_rgba(0,0,0,0.38)]"
          >
            {commands.length > 0 ? commands.map(command => {
              const isHighlighted = command.id === activeCommandId;
              const isActive = command.action.mode === activeMode;
              return (
                <button
                  key={command.id}
                  id={`${listboxId}-${command.id}`}
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  onPointerDown={event => event.preventDefault()}
                  onMouseEnter={() => onActiveCommandChange(command.id)}
                  onClick={() => onSelectCommand(command)}
                  className={cn(
                    'flex min-h-11 w-full cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2 text-left outline-none',
                    'transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]',
                    isHighlighted
                      ? 'bg-foreground/[0.07] text-foreground'
                      : 'text-foreground/80 hover:bg-foreground/[0.045] hover:text-foreground',
                  )}
                >
                  <CommandIcon
                    mode={command.action.mode}
                    className={cn(
                      'h-[17px] w-[17px] shrink-0',
                      command.action.mode === 'search'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-purple-600 dark:text-purple-400',
                    )}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="shrink-0 text-[13px] font-medium leading-tight">
                      {command.label}
                    </span>
                    <span className="truncate text-[12px] font-normal leading-tight text-muted-foreground/75">
                      {command.description}
                    </span>
                  </span>
                  {isActive && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-foreground/65" title="Active">
                      <Check className="h-3.5 w-3.5" strokeWidth={2} />
                      <span className="sr-only">Active</span>
                    </span>
                  )}
                </button>
              );
            }) : (
              <div className="flex min-h-11 items-center px-3 text-[13px] text-muted-foreground/75">
                No matching modes
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
