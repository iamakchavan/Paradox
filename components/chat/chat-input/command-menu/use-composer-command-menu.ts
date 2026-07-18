'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import {
  filterComposerCommands,
  findComposerCommandTrigger,
  type ComposerCommandDefinition,
} from './registry';

interface UseComposerCommandMenuOptions {
  value: string;
  caretPosition: number;
  disabled: boolean;
  availableCommands: readonly ComposerCommandDefinition[];
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onValueChange: (value: string, caretPosition: number) => void;
  onExecute: (command: ComposerCommandDefinition) => void;
}

export function useComposerCommandMenu({
  value,
  caretPosition,
  disabled,
  availableCommands,
  textareaRef,
  onValueChange,
  onExecute,
}: UseComposerCommandMenuOptions) {
  const listboxId = useId();
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);
  const [activeChangeSource, setActiveChangeSource] = useState<
    'keyboard' | 'pointer' | null
  >(null);
  const [dismissedTriggerKey, setDismissedTriggerKey] = useState<string | null>(null);

  const trigger = useMemo(
    () => findComposerCommandTrigger(value, caretPosition),
    [caretPosition, value],
  );
  const commands = useMemo(
    () => trigger ? filterComposerCommands(trigger.query, availableCommands) : [],
    [availableCommands, trigger],
  );
  const isOpen = Boolean(
    trigger
      && !disabled
      && dismissedTriggerKey !== trigger.key,
  );
  const activeCommand = commands.find(command => command.id === activeCommandId) ?? commands[0] ?? null;

  useEffect(() => {
    if (trigger) return;
    setDismissedTriggerKey(null);
    setActiveCommandId(null);
    setActiveChangeSource(null);
  }, [trigger]);

  const dismiss = useCallback(() => {
    if (trigger) setDismissedTriggerKey(trigger.key);
    setActiveCommandId(null);
    setActiveChangeSource(null);
  }, [trigger]);

  const setActiveCommandFromPointer = useCallback((commandId: string) => {
    setActiveChangeSource('pointer');
    setActiveCommandId(commandId);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const eventPath = event.composedPath();
      const textarea = textareaRef.current;
      const listbox = document.getElementById(listboxId);

      if (textarea && eventPath.includes(textarea)) return;
      if (listbox && eventPath.includes(listbox)) return;
      dismiss();
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    };
  }, [dismiss, isOpen, listboxId, textareaRef]);

  const selectCommand = useCallback((command: ComposerCommandDefinition) => {
    if (!trigger) return;

    const beforeTrigger = value.slice(0, trigger.start);
    let afterTrigger = value.slice(trigger.end);
    if (/\s$/.test(beforeTrigger) && /^\s/.test(afterTrigger)) {
      afterTrigger = afterTrigger.replace(/^\s+/, ' ');
    }
    const nextValue = beforeTrigger + afterTrigger;
    const nextCaretPosition = beforeTrigger.length;

    setDismissedTriggerKey(trigger.key);
    setActiveCommandId(null);
    onValueChange(nextValue, nextCaretPosition);
    onExecute(command);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  }, [onExecute, onValueChange, textareaRef, trigger, value]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen || event.nativeEvent.isComposing) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
      return;
    }
    if (commands.length === 0) return;

    const activeIndex = activeCommand
      ? commands.findIndex(command => command.id === activeCommand.id)
      : 0;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (activeIndex + direction + commands.length) % commands.length;
      setActiveChangeSource('keyboard');
      setActiveCommandId(commands[nextIndex].id);
      return;
    }
    if ((event.key === 'Enter' && !event.shiftKey) || event.key === 'Tab') {
      event.preventDefault();
      if (activeCommand) selectCommand(activeCommand);
    }
  }, [activeCommand, commands, dismiss, isOpen, selectCommand]);

  return {
    isOpen,
    listboxId,
    commands,
    activeCommandId: activeCommand?.id ?? null,
    activeChangeSource,
    activeOptionId: activeCommand ? `${listboxId}-${activeCommand.id}` : undefined,
    setActiveCommandFromPointer,
    selectCommand,
    handleKeyDown,
    dismiss,
  };
}
