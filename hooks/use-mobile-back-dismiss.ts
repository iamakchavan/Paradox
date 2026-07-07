import { useEffect, useRef } from 'react';

interface UseMobileBackDismissOptions {
  isOpen: boolean;
  isMobile: boolean;
  stateKey: string;
  entryPrefix: string;
  onDismiss: () => void;
  onBeforeDismiss?: (event: PopStateEvent) => boolean;
  getDismissHistoryDelta?: () => number;
}

export function useMobileBackDismiss({
  isOpen,
  isMobile,
  stateKey,
  entryPrefix,
  onDismiss,
  onBeforeDismiss,
  getDismissHistoryDelta,
}: UseMobileBackDismissOptions) {
  const historyEntryRef = useRef<string | null>(null);
  const dismissedByHistoryRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  const onBeforeDismissRef = useRef(onBeforeDismiss);
  const getDismissHistoryDeltaRef = useRef(getDismissHistoryDelta);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    onBeforeDismissRef.current = onBeforeDismiss;
  }, [onBeforeDismiss]);

  useEffect(() => {
    getDismissHistoryDeltaRef.current = getDismissHistoryDelta;
  }, [getDismissHistoryDelta]);

  useEffect(() => {
    if (!isOpen || !isMobile || typeof window === 'undefined') return;

    const entryId = `${entryPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    historyEntryRef.current = entryId;
    dismissedByHistoryRef.current = false;

    window.history.pushState(
      { ...(window.history.state || {}), [stateKey]: entryId },
      '',
      window.location.href
    );

    const handlePopState = (event: PopStateEvent) => {
      if (historyEntryRef.current !== entryId) return;

      if (onBeforeDismissRef.current?.(event)) {
        return;
      }

      dismissedByHistoryRef.current = true;
      historyEntryRef.current = null;
      onDismissRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      if (historyEntryRef.current === entryId) {
        const state = window.history.state || {};
        historyEntryRef.current = null;

        if (!dismissedByHistoryRef.current && state[stateKey] === entryId) {
          window.history.go(getDismissHistoryDeltaRef.current?.() ?? -1);
        }
      }
    };
  }, [entryPrefix, isMobile, isOpen, stateKey]);
}
