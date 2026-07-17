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
  const measurementFrameRef = useRef<number | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const measureScrollState = useCallback(() => {
    if (measurementFrameRef.current !== null) return;

    measurementFrameRef.current = requestAnimationFrame(() => {
      measurementFrameRef.current = null;
      const container = scrollContainerRef.current;
      if (!container) return;

      const distance = Math.max(
        0,
        container.scrollHeight - (container.scrollTop + container.clientHeight),
      );
      const next = distance > 200 && container.scrollHeight > container.clientHeight + 200;

      if (next !== showButtonRef.current) {
        showButtonRef.current = next;
        setShowScrollButton(next);
      }
      userScrolledUpRef.current = distance > 100;
    });
  }, []);

  useEffect(() => {
    if (measurementFrameRef.current !== null) {
      cancelAnimationFrame(measurementFrameRef.current);
      measurementFrameRef.current = null;
    }
    showButtonRef.current = false;
    setShowScrollButton(false);
    initialSnapRef.current = true;
    const timer = setTimeout(() => { initialSnapRef.current = false; }, 800);
    return () => clearTimeout(timer);
  }, [chatId]);

  useEffect(() => {
    if (isInitialView) return;
    const handleScroll = () => {
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
      measureScrollState();
    };
    const touchStart = () => { userTouchingRef.current = true; };
    const touchEnd = () => { userTouchingRef.current = false; };
    const container = scrollContainerRef.current;
    if (!container) return;
    measureScrollState();
    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', touchStart, { passive: true });
    container.addEventListener('touchend', touchEnd, { passive: true });
    container.addEventListener('touchcancel', touchEnd, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', touchStart);
      container.removeEventListener('touchend', touchEnd);
      container.removeEventListener('touchcancel', touchEnd);
    };
  }, [isInitialView, isLoadingRef, measureScrollState]);

  useEffect(() => {
    if (!chatId || isInitialView) return;
    const container = scrollContainerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    container.scrollTop = container.scrollHeight;
    userScrolledUpRef.current = false;
    const observer = new ResizeObserver(() => {
      if (initialSnapRef.current) container.scrollTop = container.scrollHeight;
      measureScrollState();
    });
    observer.observe(content);
    observer.observe(container);
    return () => observer.disconnect();
  }, [chatId, isInitialView, measureScrollState]);

  useEffect(() => () => {
    if (measurementFrameRef.current !== null) {
      cancelAnimationFrame(measurementFrameRef.current);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    measureScrollState();
  }, [measureScrollState]);

  return {
    messagesEndRef,
    scrollContainerRef,
    contentRef,
    showScrollButton,
    scrollToBottom,
  };
}
