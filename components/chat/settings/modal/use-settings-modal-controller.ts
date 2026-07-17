"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiKeys } from '@/hooks/use-api-keys';
import { useApiKeys } from '@/hooks/use-api-keys';
import { useCustomToast } from '@/components/ui/custom-toast';
import { useMobileBackDismiss } from '@/hooks/use-mobile-back-dismiss';
import { SETTINGS_FIELDS } from './settings-modal-config';
import type { SettingsInputKeys, SettingsTabId } from './types';

const EMPTY_INPUT_KEYS: SettingsInputKeys = {
  geminiApiKey: '',
  perplexityApiKey: '',
  mistralApiKey: '',
  inceptionApiKey: '',
  zenmuxApiKey: '',
  nvidiaApiKey: '',
  tavilyApiKey: '',
  exaApiKey: '',
  firecrawlApiKey: '',
};

export function useSettingsModalController({
  isOpen,
  isMobile,
  onClose,
}: {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}) {
  const { keys: apiKeys, updateKey } = useApiKeys();
  const { showToast } = useCustomToast();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const mobileViewRef = useRef<SettingsTabId | null>(null);
  const mobileViewHistoryEntryRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTabId>('appearance');
  const [mobileView, setMobileView] = useState<SettingsTabId | null>(null);
  const [inputKeys, setInputKeys] = useState<SettingsInputKeys>(EMPTY_INPUT_KEYS);

  useEffect(() => {
    mobileViewRef.current = mobileView;
  }, [mobileView]);

  useEffect(() => {
    if (isOpen) {
      mobileViewRef.current = null;
      mobileViewHistoryEntryRef.current = null;
      setInputKeys({
        geminiApiKey: apiKeys.geminiApiKey || '',
        perplexityApiKey: apiKeys.perplexityApiKey || '',
        mistralApiKey: apiKeys.mistralApiKey || '',
        inceptionApiKey: apiKeys.inceptionApiKey || '',
        zenmuxApiKey: apiKeys.zenmuxApiKey || '',
        nvidiaApiKey: apiKeys.nvidiaApiKey || '',
        tavilyApiKey: apiKeys.tavilyApiKey || '',
        exaApiKey: apiKeys.exaApiKey || '',
        firecrawlApiKey: apiKeys.firecrawlApiKey || '',
      });
      setActiveTab('appearance');
      setMobileView(null);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const beforeDismiss = useCallback((event: PopStateEvent) => {
    const viewEntryId = mobileViewHistoryEntryRef.current;
    if (
      mobileViewRef.current
      && viewEntryId
      && event.state?.paradoxModalView !== viewEntryId
    ) {
      mobileViewHistoryEntryRef.current = null;
      setMobileView(null);
      return true;
    }
    return false;
  }, []);

  const getDismissHistoryDelta = useCallback(() => {
    const viewEntryId = mobileViewHistoryEntryRef.current;
    if (
      viewEntryId
      && typeof window !== 'undefined'
      && window.history.state?.paradoxModalView === viewEntryId
    ) {
      return -2;
    }
    return -1;
  }, []);

  const { runAfterHistoryDismiss } = useMobileBackDismiss({
    isOpen,
    isMobile,
    stateKey: 'paradoxModal',
    entryPrefix: 'settings',
    onDismiss: onClose,
    onBeforeDismiss: beforeDismiss,
    getDismissHistoryDelta,
  });

  useEffect(() => {
    if (!isOpen || !isMobile || !mobileView || typeof window === 'undefined') return;
    if (mobileViewHistoryEntryRef.current) return;
    const entryId = `settings-view-${mobileView}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    mobileViewHistoryEntryRef.current = entryId;
    window.history.pushState(
      { ...(window.history.state || {}), paradoxModalView: entryId },
      '',
      window.location.href
    );
  }, [isOpen, isMobile, mobileView]);

  const closeMobileView = () => {
    if (mobileViewHistoryEntryRef.current && window.history.state?.paradoxModalView) {
      window.history.back();
    } else {
      setMobileView(null);
    }
  };

  const close = useCallback(() => {
    if (isOpen) runAfterHistoryDismiss(onClose);
  }, [isOpen, onClose, runAfterHistoryDismiss]);

  const save = useCallback(() => {
    SETTINGS_FIELDS.forEach(({ key, storageKey }) => {
      const value = (inputKeys[key] || '').trim();
      if (value) {
        localStorage.setItem(storageKey, value);
        updateKey(key, value);
      } else {
        localStorage.removeItem(storageKey);
        updateKey(key, null);
      }
    });
    showToast({
      title: 'Settings Saved',
      message: 'Your settings have been saved successfully.',
      type: 'success',
      mode: 'capsule',
    });
    runAfterHistoryDismiss(onClose);
  }, [inputKeys, onClose, runAfterHistoryDismiss, showToast, updateKey]);

  return {
    apiKeys: apiKeys as ApiKeys,
    contentRef,
    activeTab,
    setActiveTab,
    mobileView,
    setMobileView,
    inputKeys,
    setInputKeys,
    save,
    close,
    closeMobileView,
  };
}

export type SettingsModalController = ReturnType<typeof useSettingsModalController>;
