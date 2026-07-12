"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';

interface Options {
  chatId: string | null;
  isInitialView: boolean;
  isLoadingRef: MutableRefObject<boolean>;
}

export function useChatScroll({ chatId, isInitialView, isLoadingRef }: Options) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const initialSnapRef = useRef(false);
  const userScrolledUpRef = useRef(false);
  const showButtonRef = useRef(false);
  const userTouchingRef = useRef(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    showButtonRef.current = false;
    setShowScrollButton(false);
    initialSnapRef.current = true;
    const timer = setTimeout(() => { initialSnapRef.current = false; }, 800);
    return () => clearTimeout(timer);
  }, [chatId]);

  useEffect(() => {
    if (isInitialView) return;
    let rafId: number | null = null;
    let pendingValue: boolean | null = null;
    const flush = () => {
      rafId = null;
      if (pendingValue !== null) {
        setShowScrollButton(pendingValue);
        pendingValue = null;
      }
    };
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const isTouchViewport = window.innerWidth < 1024
        || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || 'ontouchstart' in window
        || navigator.maxTouchPoints > 0;
      if (isTouchViewport && !isLoadingRef.current && userTouchingRef.current) {
        const activeElement = document.activeElement;
        if (activeElement && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(activeElement.tagName)) {
          (activeElement as HTMLElement).blur();
        }
      }
      const distance = container.scrollHeight - (container.scrollTop + container.clientHeight);
      const next = distance > 200 && container.scrollHeight > container.clientHeight + 200;
      if (next !== showButtonRef.current) {
        showButtonRef.current = next;
        pendingValue = next;
        if (rafId === null) rafId = requestAnimationFrame(flush);
      }
      userScrolledUpRef.current = distance > 100;
    };
    const touchStart = () => { userTouchingRef.current = true; };
    const touchEnd = () => { userTouchingRef.current = false; };
    const container = scrollContainerRef.current;
    if (!container) return;
    handleScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', touchStart, { passive: true });
    container.addEventListener('touchend', touchEnd, { passive: true });
    container.addEventListener('touchcancel', touchEnd, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', touchStart);
      container.removeEventListener('touchend', touchEnd);
      container.removeEventListener('touchcancel', touchEnd);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isInitialView, isLoadingRef]);

  useEffect(() => {
    if (!chatId || isInitialView) return;
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    container.scrollTop = container.scrollHeight;
    userScrolledUpRef.current = false;
    const observer = new ResizeObserver(() => {
      if (initialSnapRef.current) container.scrollTop = container.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [chatId, isInitialView]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return {
    messagesEndRef,
    scrollContainerRef,
    contentRef,
    showScrollButton,
    scrollToBottom,
  };
}
