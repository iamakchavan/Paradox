"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { MODELS_REGISTRY } from '@/lib/models';
import type { ComposerCommandDefinition } from './command-menu/registry';
import { useComposerCommandMenu } from './command-menu/use-composer-command-menu';
import { isMobileOrTablet } from './icons';
import type { ChatInputProps } from './types';

export function useChatInputController(props: ChatInputProps) {
  const {
    handleFileUpload,
    handleSubmit,
    onExpandedChange,
    onToggleResearch,
    onToggleSearch,
    selectedImages,
    selectedPDFs,
    setMessage: setExternalMessage,
  } = props;
  const [localMessage, setLocalMessage] = useState(props.message || '');
  const [caretPosition, setCaretPosition] = useState((props.message || '').length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [showMobileAttachSheet, setShowMobileAttachSheet] = useState(false);
  const [showAppsSubmenu, setShowAppsSubmenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchCapsuleHovered, setIsSearchCapsuleHovered] = useState(false);
  const [isResearchCapsuleHovered, setIsResearchCapsuleHovered] = useState(false);
  const mcpServers = useLiveQuery(() => db.mcpIntegrations.toArray()) || [];
  const activeApps = mcpServers.filter(server => server.isEnabled && server.status === 'connected');

  useEffect(() => {
    const nextMessage = props.message || '';
    setLocalMessage(nextMessage);
    setCaretPosition(nextMessage.length);
  }, [props.message]);

  const expanded = useMemo(() => {
    if (isMobile) {
      return (isFocused && localMessage.length > 0)
        || props.selectedImages.length > 0
        || props.selectedPDFs.length > 0
        || Boolean(props.searchEnabled)
        || Boolean(props.researchEnabled);
    }
    return localMessage.length > 0
      || props.selectedImages.length > 0
      || props.selectedPDFs.length > 0
      || Boolean(props.searchEnabled)
      || Boolean(props.researchEnabled);
  }, [isFocused, isMobile, localMessage.length, props.researchEnabled, props.searchEnabled, props.selectedImages.length, props.selectedPDFs.length]);

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '24px';
    if (expanded) {
      textarea.style.height = `${Math.min(textarea.scrollHeight, props.isInitialView ? 240 : 160)}px`;
    }
  }, [expanded, props.isInitialView]);

  useEffect(() => {
    adjustTextareaHeight();
    const textarea = textareaRef.current;
    if (!textarea || expanded) return;
    textarea.scrollTop = 0;
    textarea.scrollLeft = 0;
    const reset = () => {
      textarea.scrollTop = 0;
      textarea.scrollLeft = 0;
    };
    const first = setTimeout(reset, 50);
    const second = setTimeout(reset, 150);
    const third = setTimeout(reset, 350);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
      clearTimeout(third);
    };
    // Keep the original trigger set: initial-view changes alone did not resize the textarea.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, localMessage]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showAttachDropdown && !target.closest('.attach-dropdown-container')) {
        setShowAttachDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showAttachDropdown]);

  useEffect(() => {
    if (!isMobileOrTablet() && !props.isLoading) textareaRef.current?.focus();
  }, [props.isLoading]);
  useEffect(() => {
    if (!isMobileOrTablet() && (props.shouldFocus || props.isInitialView)) textareaRef.current?.focus();
  }, [props.isInitialView, props.shouldFocus]);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const dragEnter = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) setIsDragging(true);
    };
    const dragLeave = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) setIsDragging(false);
    };
    const dragOver = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const drop = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;
      const files = Array.from(event.dataTransfer?.files || []);
      if (files.length === 0) return;
      handleFileUpload({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>);
    };
    window.addEventListener('dragenter', dragEnter);
    window.addEventListener('dragleave', dragLeave);
    window.addEventListener('dragover', dragOver);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', dragEnter);
      window.removeEventListener('dragleave', dragLeave);
      window.removeEventListener('dragover', dragOver);
      window.removeEventListener('drop', drop);
    };
  }, [handleFileUpload]);

  useEffect(() => {
    if (!props.searchEnabled) setIsSearchCapsuleHovered(false);
  }, [props.searchEnabled]);
  useEffect(() => {
    if (!props.researchEnabled) setIsResearchCapsuleHovered(false);
  }, [props.researchEnabled]);

  const isSendDisabled = useMemo(() => {
    const activeModel = MODELS_REGISTRY.find(model => model.id === props.selectedModelId) || MODELS_REGISTRY[0];
    const key = activeModel.provider === 'google'
      ? props.geminiApiKey
      : activeModel.provider === 'mistral'
        ? props.mistralApiKey
        : activeModel.provider === 'perplexity'
          ? props.perplexityApiKey
          : activeModel.provider === 'nvidia'
            ? props.nvidiaApiKey
            : activeModel.provider === 'inception'
              ? props.inceptionApiKey
              : props.zenmuxApiKey;
    return !key || !(localMessage.trim() || props.selectedImages.length > 0 || props.selectedPDFs.length > 0);
  }, [localMessage, props.geminiApiKey, props.inceptionApiKey, props.mistralApiKey, props.nvidiaApiKey, props.perplexityApiKey, props.selectedImages, props.selectedModelId, props.selectedPDFs, props.zenmuxApiKey]);
  const isInputDisabled = !props.geminiApiKey
    && !props.mistralApiKey
    && !props.perplexityApiKey
    && !props.zenmuxApiKey
    && !props.nvidiaApiKey
    && !props.inceptionApiKey;

  const updateMessage = useCallback((value: string, nextCaretPosition: number) => {
    setLocalMessage(value);
    setCaretPosition(nextCaretPosition);
    setExternalMessage?.(value);
  }, [setExternalMessage]);

  const executeComposerCommand = useCallback((command: ComposerCommandDefinition) => {
    switch (command.action.type) {
      case 'set-mode':
        if (command.action.mode === 'search') onToggleSearch?.(true);
        if (command.action.mode === 'research') onToggleResearch?.(true);
        break;
    }
  }, [onToggleResearch, onToggleSearch]);

  const commandMenu = useComposerCommandMenu({
    value: localMessage,
    caretPosition,
    disabled: !isFocused
      || props.isLoading
      || isDragging
      || showAttachDropdown
      || showMobileAttachSheet
      || isInputDisabled,
    textareaRef,
    onValueChange: updateMessage,
    onExecute: executeComposerCommand,
  });
  const dismissCommandMenu = commandMenu.dismiss;

  const setAttachDropdownOpen = useCallback((show: boolean) => {
    if (show) dismissCommandMenu();
    setShowAttachDropdown(show);
  }, [dismissCommandMenu]);
  const setMobileAttachSheetOpen = useCallback((show: boolean) => {
    if (show) dismissCommandMenu();
    setShowMobileAttachSheet(show);
  }, [dismissCommandMenu]);
  const setAppsSubmenuOpen = useCallback((show: boolean) => {
    if (show) dismissCommandMenu();
    setShowAppsSubmenu(show);
  }, [dismissCommandMenu]);

  const submit = useCallback(() => {
    if (!localMessage.trim() && selectedImages.length === 0 && selectedPDFs.length === 0) return;
    dismissCommandMenu();
    if (isMobileOrTablet()) textareaRef.current?.blur();
    handleSubmit(localMessage);
    setLocalMessage('');
    setCaretPosition(0);
  }, [dismissCommandMenu, handleSubmit, localMessage, selectedImages.length, selectedPDFs.length]);

  const attach = useCallback((type: 'image' | 'pdf' | 'all') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image'
        ? '.png,.jpg,.jpeg,.gif,.webp'
        : type === 'pdf' ? '.pdf' : '.png,.jpg,.jpeg,.gif,.webp,.pdf';
      fileInputRef.current.click();
    }
    setShowAttachDropdown(false);
    setShowMobileAttachSheet(false);
    dismissCommandMenu();
  }, [dismissCommandMenu]);

  const handleTextChange = useCallback((value: string, nextCaretPosition: number) => {
    updateMessage(value, nextCaretPosition);
    adjustTextareaHeight();
  }, [adjustTextareaHeight, updateMessage]);
  const handleSelectionChange = useCallback((nextCaretPosition: number) => {
    setCaretPosition(nextCaretPosition);
  }, []);
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    setCaretPosition(selectionStart);

    // Preserve deliberate pointer, touch, and programmatic selections. The
    // delayed reset is only needed for the legacy auto-focus-at-zero case.
    if (textarea.value.length === 0 || selectionStart !== 0 || selectionEnd !== 0) return;

    const length = textarea.value.length;
    const moveToEnd = () => {
      textarea.setSelectionRange(length, length);
      textarea.scrollTop = textarea.scrollHeight;
      setCaretPosition(length);
    };
    setTimeout(moveToEnd, 50);
    setTimeout(moveToEnd, 150);
    setTimeout(moveToEnd, 350);
  }, []);
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const textarea = textareaRef.current;
    if (!textarea) return;
    const moveToStart = () => {
      textarea.scrollTop = 0;
      textarea.scrollLeft = 0;
    };
    setTimeout(moveToStart, 50);
    setTimeout(moveToStart, 150);
    setTimeout(moveToStart, 350);
  }, []);
  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (!item.type.includes('image')) continue;
      event.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = loadEvent => {
        if (loadEvent.target?.result) {
          handleFileUpload({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [handleFileUpload]);

  return {
    localMessage,
    textareaRef,
    fileInputRef,
    activeApps,
    isDragging,
    isMobile,
    expanded,
    showAttachDropdown,
    setShowAttachDropdown: setAttachDropdownOpen,
    showMobileAttachSheet,
    setShowMobileAttachSheet: setMobileAttachSheetOpen,
    showAppsSubmenu,
    setShowAppsSubmenu: setAppsSubmenuOpen,
    isSearchCapsuleHovered,
    setIsSearchCapsuleHovered,
    isResearchCapsuleHovered,
    setIsResearchCapsuleHovered,
    isSendDisabled,
    isInputDisabled,
    submit,
    attach,
    adjustTextareaHeight,
    handleTextChange,
    handleSelectionChange,
    handleFocus,
    handleBlur,
    handlePaste,
    commandMenu,
  };
}
