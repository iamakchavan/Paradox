"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { MODELS_REGISTRY } from '@/lib/models';
import { isMobileOrTablet } from './icons';
import type { ChatInputProps } from './types';

export function useChatInputController(props: ChatInputProps) {
  const [localMessage, setLocalMessage] = useState(props.message || '');
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
    setLocalMessage(props.message || '');
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
    props.onExpandedChange?.(expanded);
  }, [expanded, props.onExpandedChange]);

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
      props.handleFileUpload({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>);
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
  }, [props.handleFileUpload]);

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

  const submit = useCallback(() => {
    if (!localMessage.trim() && props.selectedImages.length === 0 && props.selectedPDFs.length === 0) return;
    if (isMobileOrTablet()) textareaRef.current?.blur();
    props.handleSubmit(localMessage);
    setLocalMessage('');
  }, [localMessage, props.handleSubmit, props.selectedImages.length, props.selectedPDFs.length]);

  const attach = useCallback((type: 'image' | 'pdf' | 'all') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image'
        ? '.png,.jpg,.jpeg,.gif,.webp'
        : type === 'pdf' ? '.pdf' : '.png,.jpg,.jpeg,.gif,.webp,.pdf';
      fileInputRef.current.click();
    }
    setShowAttachDropdown(false);
    setShowMobileAttachSheet(false);
  }, []);

  const handleTextChange = useCallback((value: string) => {
    setLocalMessage(value);
    props.setMessage?.(value);
    adjustTextareaHeight();
  }, [adjustTextareaHeight, props.setMessage]);
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    const textarea = textareaRef.current;
    if (!textarea) return;
    const length = textarea.value.length;
    const moveToEnd = () => {
      textarea.setSelectionRange(length, length);
      textarea.scrollTop = textarea.scrollHeight;
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
          props.handleFileUpload({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [props.handleFileUpload]);

  return {
    localMessage,
    textareaRef,
    fileInputRef,
    activeApps,
    isDragging,
    isMobile,
    expanded,
    showAttachDropdown,
    setShowAttachDropdown,
    showMobileAttachSheet,
    setShowMobileAttachSheet,
    showAppsSubmenu,
    setShowAppsSubmenu,
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
    handleFocus,
    handleBlur,
    handlePaste,
  };
}
