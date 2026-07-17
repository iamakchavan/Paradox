"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMobileBackDismiss } from '@/hooks/use-mobile-back-dismiss';
import type { MCPIntegration } from '@/lib/db';
import type { MobileAttachView } from './types';

export function useMobileAttachController({
  isOpen,
  onClose,
  activeApps,
  selectedMcpIds,
  onManageConnectors,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeApps: MCPIntegration[];
  selectedMcpIds: string[];
  onManageConnectors: () => void;
}) {
  const [view, setView] = useState<MobileAttachView>('main');
  const viewRef = useRef<MobileAttachView>('main');
  const viewHistoryEntryRef = useRef<string | null>(null);
  const selectedAppsCount = useMemo(
    () => activeApps.filter(app => selectedMcpIds.includes(app.id)).length,
    [activeApps, selectedMcpIds]
  );

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    if (isOpen) {
      viewHistoryEntryRef.current = null;
      setView('main');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || view !== 'apps' || typeof window === 'undefined') return;
    if (viewHistoryEntryRef.current) return;
    const entryId = `mobile-attach-apps-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    viewHistoryEntryRef.current = entryId;
    window.history.pushState(
      { ...(window.history.state || {}), paradoxMobileAttachSheetView: entryId },
      '',
      window.location.href
    );
  }, [isOpen, view]);

  const backToMain = useCallback(() => {
    const viewEntryId = viewHistoryEntryRef.current;
    if (
      viewEntryId
      && typeof window !== 'undefined'
      && window.history.state?.paradoxMobileAttachSheetView === viewEntryId
    ) {
      window.history.back();
      return;
    }
    viewHistoryEntryRef.current = null;
    setView('main');
  }, []);

  const beforeDismiss = useCallback((event: PopStateEvent) => {
    const viewEntryId = viewHistoryEntryRef.current;
    if (
      viewRef.current === 'apps'
      && viewEntryId
      && event.state?.paradoxMobileAttachSheetView !== viewEntryId
    ) {
      viewHistoryEntryRef.current = null;
      setView('main');
      return true;
    }
    return false;
  }, []);

  const getDismissHistoryDelta = useCallback(() => {
    const viewEntryId = viewHistoryEntryRef.current;
    if (
      viewEntryId
      && typeof window !== 'undefined'
      && window.history.state?.paradoxMobileAttachSheetView === viewEntryId
    ) {
      return -2;
    }
    return -1;
  }, []);

  const { runAfterHistoryDismiss } = useMobileBackDismiss({
    isOpen,
    isMobile: true,
    stateKey: 'paradoxMobileAttachSheet',
    entryPrefix: 'mobile-attach-sheet',
    onDismiss: onClose,
    onBeforeDismiss: beforeDismiss,
    getDismissHistoryDelta,
  });

  const dismissSheet = useCallback(() => {
    runAfterHistoryDismiss(onClose);
  }, [onClose, runAfterHistoryDismiss]);

  const manageConnectors = useCallback(() => {
    runAfterHistoryDismiss(onManageConnectors);
  }, [onManageConnectors, runAfterHistoryDismiss]);

  return {
    view,
    setView,
    selectedAppsCount,
    backToMain,
    dismissSheet,
    manageConnectors,
  };
}

export type MobileAttachController = ReturnType<typeof useMobileAttachController>;
