"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiKeys } from '@/hooks/use-api-keys';
import { useApiKeys } from '@/hooks/use-api-keys';
import { useCustomToast } from '@/components/ui/custom-toast';
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
  const historyEntryRef = useRef<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const mobileViewRef = useRef<SettingsTabId | null>(null);
  const mobileViewHistoryEntryRef = useRef<string | null>(null);
  const closedByHistoryRef = useRef(false);
  const [activeTab, setActiveTab] = useState<SettingsTabId>('appearance');
  const [mobileView, setMobileView] = useState<SettingsTabId | null>(null);
  const [inputKeys, setInputKeys] = useState<SettingsInputKeys>(EMPTY_INPUT_KEYS);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    mobileViewRef.current = mobileView;
  }, [mobileView]);

  useEffect(() => {
    if (isOpen) {
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
    onClose();
  }, [inputKeys, updateKey, showToast, onClose]);

  const close = useCallback(() => {
    if (isOpen) onClose();
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !isMobile || typeof window === 'undefined') return;

    const entryId = `settings-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    historyEntryRef.current = entryId;
    mobileViewRef.current = null;
    mobileViewHistoryEntryRef.current = null;
    closedByHistoryRef.current = false;
    setMobileView(null);

    window.history.pushState(
      { ...(window.history.state || {}), paradoxModal: entryId },
      '',
      window.location.href
    );

    const handlePopState = (event: PopStateEvent) => {
      const nextState = event.state || {};
      const viewEntryId = mobileViewHistoryEntryRef.current;
      if (
        mobileViewRef.current
        && viewEntryId
        && nextState.paradoxModal === entryId
        && nextState.paradoxModalView !== viewEntryId
      ) {
        mobileViewHistoryEntryRef.current = null;
        setMobileView(null);
        return;
      }

      if (historyEntryRef.current !== entryId) return;
      closedByHistoryRef.current = true;
      historyEntryRef.current = null;
      mobileViewHistoryEntryRef.current = null;
      setMobileView(null);
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (historyEntryRef.current === entryId) {
        const viewEntryId = mobileViewHistoryEntryRef.current;
        const state = window.history.state || {};
        historyEntryRef.current = null;
        mobileViewHistoryEntryRef.current = null;
        mobileViewRef.current = null;
        if (!closedByHistoryRef.current) {
          if (viewEntryId && state.paradoxModalView === viewEntryId) {
            window.history.go(-2);
          } else if (state.paradoxModal === entryId) {
            window.history.go(-1);
          }
        }
      }
    };
  }, [isOpen, isMobile]);

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
