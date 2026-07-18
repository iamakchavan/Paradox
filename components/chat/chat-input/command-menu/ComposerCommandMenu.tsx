'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from 'framer-motion';
import { MOTION_EASE_OUT, motionTransitions } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { ComposerCommandIcon } from './ComposerCommandIcon';
import type {
  ComposerCommandDefinition,
  ComposerCommandGroup,
  ComposerMode,
} from './registry';

interface ComposerCommandMenuProps {
  isOpen: boolean;
  listboxId: string;
  commands: ComposerCommandDefinition[];
  activeCommandId: string | null;
  activeChangeSource: 'keyboard' | 'pointer' | null;
  activeMode: ComposerMode | null;
  selectedMcpIds: readonly string[];
  onActiveCommandChange: (commandId: string) => void;
  onSelectCommand: (command: ComposerCommandDefinition) => void;
}

const GROUP_ORDER: readonly ComposerCommandGroup[] = ['modes', 'apps'];
const COMPOSER_OVERLAP_PX = 24;
const OPTION_REVEAL_GUTTER_PX = 6;

function ComposerCommandMenuPanel({
  reduceMotion,
  children,
}: {
  reduceMotion: boolean | null;
  children: ReactNode;
}) {
  const isPresent = useIsPresent();

  return (
    <motion.div
      aria-hidden={!isPresent}
      inert={!isPresent}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.99 }}
      transition={motionTransitions.popover}
      className={cn(
        'absolute inset-x-3 z-0 origin-bottom',
        !isPresent && 'pointer-events-none',
      )}
      style={{ bottom: 'calc(100% - 24px)' }}
    >
      {children}
    </motion.div>
  );
}

export function ComposerCommandMenu({
  isOpen,
  listboxId,
  commands,
  activeCommandId,
  activeChangeSource,
  activeMode,
  selectedMcpIds,
  onActiveCommandChange,
  onSelectCommand,
}: ComposerCommandMenuProps) {
  const reduceMotion = useReducedMotion();
  const listboxRef = useRef<HTMLDivElement>(null);
  const commandGroups = GROUP_ORDER
    .map(group => ({
      group,
      commands: commands.filter(command => command.group === group),
    }))
    .filter(section => section.commands.length > 0);

  useLayoutEffect(() => {
    if (
      !isOpen
      || !activeCommandId
      || activeChangeSource !== 'keyboard'
    ) return;

    const listbox = listboxRef.current;
    const activeOption = document.getElementById(`${listboxId}-${activeCommandId}`);
    if (!listbox || !activeOption || !listbox.contains(activeOption)) return;

    const listboxRect = listbox.getBoundingClientRect();
    const optionRect = activeOption.getBoundingClientRect();
    const visibleTop = listboxRect.top + OPTION_REVEAL_GUTTER_PX;
    const visibleBottom = listboxRect.bottom
      - COMPOSER_OVERLAP_PX
      - OPTION_REVEAL_GUTTER_PX;

    if (optionRect.top < visibleTop) {
      listbox.scrollTop -= visibleTop - optionRect.top;
    } else if (optionRect.bottom > visibleBottom) {
      listbox.scrollTop += optionRect.bottom - visibleBottom;
    }
  }, [activeChangeSource, activeCommandId, isOpen, listboxId]);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <ComposerCommandMenuPanel
          key="composer-command-menu"
          reduceMotion={reduceMotion}
        >
          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label="Composer commands"
            className="max-h-[min(254px,40dvh)] overflow-y-auto overscroll-contain rounded-t-[20px] border border-foreground/[0.09] bg-popover p-1.5 pb-[30px] shadow-[0_-10px_32px_rgba(0,0,0,0.08)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:shadow-[0_-12px_36px_rgba(0,0,0,0.38)]"
          >
            {commands.length > 0 ? commandGroups.map((section, sectionIndex) => (
              <div
                key={section.group}
                className={cn(
                  sectionIndex > 0 && 'mt-1 border-t border-border/45 pt-1',
                )}
              >
                {section.group === 'apps' && (
                  <div className="px-3 pb-1 pt-1.5 text-[10px] font-medium leading-none text-muted-foreground/60">
                    Apps & tools
                  </div>
                )}
                {section.commands.map(command => {
                  const isHighlighted = command.id === activeCommandId;
                  const isActive = command.action.type === 'set-mode'
                    ? command.action.mode === activeMode
                    : command.action.type === 'toggle-app'
                      ? selectedMcpIds.includes(command.action.appId)
                      : false;
                  return (
                    <button
                      key={command.id}
                      id={`${listboxId}-${command.id}`}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      onPointerDown={event => event.preventDefault()}
                      onPointerMove={() => onActiveCommandChange(command.id)}
                      onClick={() => onSelectCommand(command)}
                      className={cn(
                        'relative flex min-h-11 w-full cursor-pointer select-none items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-left outline-none',
                        'transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]',
                        isHighlighted
                          ? 'text-foreground'
                          : 'text-foreground/80',
                      )}
                    >
                      {isHighlighted && (
                        <motion.span
                          layoutId="composer-command-menu-selection"
                          className="pointer-events-none absolute inset-0 rounded-xl bg-foreground/[0.07]"
                          transition={reduceMotion
                            ? { duration: 0 }
                            : { duration: 0.16, ease: MOTION_EASE_OUT }}
                        />
                      )}
                      <span className="relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                        <ComposerCommandIcon
                          command={command}
                          className="h-[17px] w-[17px] shrink-0"
                        />
                      </span>
                      <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                        <span className="shrink-0 text-[13px] font-medium leading-tight">
                          {command.label}
                        </span>
                        <span className="truncate text-[12px] font-normal leading-tight text-muted-foreground/75">
                          {command.description}
                        </span>
                      </span>
                      {isActive && (
                        <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center text-foreground/65" title="Active">
                          <Check className="h-3.5 w-3.5" strokeWidth={2} />
                          <span className="sr-only">Active</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )) : (
              <div className="flex min-h-11 items-center px-3 text-[13px] text-muted-foreground/75">
                No matching commands
              </div>
            )}
          </div>
        </ComposerCommandMenuPanel>
      )}
    </AnimatePresence>
  );
}
