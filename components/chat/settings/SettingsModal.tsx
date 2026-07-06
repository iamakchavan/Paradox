"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, ChevronRight, Paintbrush, Key } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useApiKeys } from '@/hooks/use-api-keys';
import { useCustomToast } from '@/components/ui/custom-toast';
import { AppearanceTab } from './tabs/AppearanceTab';
import { AIProvidersTab, AI_FIELDS } from './tabs/AIProvidersTab';
import { SearchScrapingTab, SEARCH_FIELDS } from './tabs/SearchScrapingTab';
import type { ApiKeys } from '@/hooks/use-api-keys';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'appearance' | 'ai-providers' | 'search-scraping';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WebSearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" stroke="currentColor" strokeWidth={1.5}></path>
    <path d="M17.8486 6.19085C19.8605 5.81929 21.3391 5.98001 21.8291 6.76327C22.8403 8.37947 19.2594 12.0342 13.8309 14.9264C8.40242 17.8185 3.18203 18.8529 2.17085 17.2367C1.63758 16.3844 2.38148 14.9651 4 13.3897" stroke="currentColor" strokeWidth={1.5}></path>
  </svg>
);

const TABS: Tab[] = [
  { id: 'appearance',       label: 'Appearance',      icon: Paintbrush, description: 'Theme and display preferences' },
  { id: 'ai-providers',     label: 'AI Providers',    icon: Key,      description: 'API keys for AI models' },
  { id: 'search-scraping',  label: 'Search & Scrape', icon: WebSearchIcon, description: 'Web search and scraping keys' },
];

const ALL_FIELDS = [...AI_FIELDS, ...SEARCH_FIELDS];

// Spring configs — defined at module level so they never re-create
const desktopSpring = { type: 'spring' as const, stiffness: 500, damping: 30 };
const mobileSpring  = { type: 'tween'  as const, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], duration: 0.32 };

// ─── Tab content helper ───────────────────────────────────────────────────────

function TabContent({
  activeTab,
  apiKeys,
  inputKeys,
  setInputKeys,
}: {
  activeTab: TabId;
  apiKeys: ApiKeys;
  inputKeys: Record<keyof ApiKeys, string>;
  setInputKeys: React.Dispatch<React.SetStateAction<Record<keyof ApiKeys, string>>>;
}) {
  switch (activeTab) {
    case 'appearance':
      return <AppearanceTab />;
    case 'ai-providers':
      return <AIProvidersTab apiKeys={apiKeys} inputKeys={inputKeys} setInputKeys={setInputKeys} />;
    case 'search-scraping':
      return <SearchScrapingTab apiKeys={apiKeys} inputKeys={inputKeys} setInputKeys={setInputKeys} />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsModal({ isOpen, onClose }: Props) {
  const isMobile = useIsMobile();
  const { keys: apiKeys, updateKey } = useApiKeys();
  const { showToast } = useCustomToast();
  const historyEntryRef = useRef<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const mobileViewRef = useRef<TabId | null>(null);
  const mobileViewHistoryEntryRef = useRef<string | null>(null);
  const closedByHistoryRef = useRef(false);

  const [activeTab, setActiveTab] = useState<TabId>('appearance');
  // Mobile only: null = tab list view, TabId = tab content view
  const [mobileView, setMobileView] = useState<TabId | null>(null);

  useEffect(() => {
    mobileViewRef.current = mobileView;
  }, [mobileView]);

  const [inputKeys, setInputKeys] = useState<Record<keyof ApiKeys, string>>({
    geminiApiKey: '',
    perplexityApiKey: '',
    mistralApiKey: '',
    inceptionApiKey: '',
    zenmuxApiKey: '',
    nvidiaApiKey: '',
    tavilyApiKey: '',
    exaApiKey: '',
    firecrawlApiKey: '',
  });

  // Sync with localStorage on open
  useEffect(() => {
    if (isOpen) {
      setInputKeys({
        geminiApiKey:     apiKeys.geminiApiKey     || '',
        perplexityApiKey: apiKeys.perplexityApiKey || '',
        mistralApiKey:    apiKeys.mistralApiKey    || '',
        inceptionApiKey:  apiKeys.inceptionApiKey  || '',
        zenmuxApiKey:     apiKeys.zenmuxApiKey     || '',
        nvidiaApiKey:     apiKeys.nvidiaApiKey     || '',
        tavilyApiKey:     apiKeys.tavilyApiKey     || '',
        exaApiKey:        apiKeys.exaApiKey        || '',
        firecrawlApiKey:  apiKeys.firecrawlApiKey  || '',
      });
      setActiveTab('appearance');
      setMobileView(null);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    ALL_FIELDS.forEach(({ key, storageKey }) => {
      const val = (inputKeys[key] || '').trim();
      if (val) {
        localStorage.setItem(storageKey, val);
        updateKey(key, val);
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

  const handleClose = useCallback(() => {
    if (isOpen) onClose();
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !isMobile || typeof window === 'undefined') return;

    const entryId = `settings-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    historyEntryRef.current = entryId;
    closedByHistoryRef.current = false;

    window.history.pushState(
      { ...(window.history.state || {}), paradoxModal: entryId },
      '',
      window.location.href
    );

    const handlePopState = () => {
      if (mobileViewRef.current) {
        mobileViewHistoryEntryRef.current = null;
        setMobileView(null);
        return;
      }

      if (historyEntryRef.current !== entryId) return;
      closedByHistoryRef.current = true;
      historyEntryRef.current = null;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      if (historyEntryRef.current === entryId) {
        historyEntryRef.current = null;
        mobileViewHistoryEntryRef.current = null;
        if (!closedByHistoryRef.current && window.history.state?.paradoxModal === entryId) {
          window.history.go(window.history.state?.paradoxModalView ? -2 : -1);
        }
      }
    };
  }, [isOpen, isMobile, onClose]);

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

  // ─── Shared dialog root ───────────────────────────────────────────────────

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => { if (!open && isOpen) handleClose(); }}
    >
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* ── Shared backdrop ── */}
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  key="settings-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={cn(
                    "fixed inset-0 z-50 bg-black/50",
                    !isMobile && "dark:bg-black/70 backdrop-blur-[6px]"
                  )}
                />
              </DialogPrimitive.Overlay>

              {/* ── Content (shared key so no remount on isMobile flip) ── */}
              <DialogPrimitive.Content
                key="settings-content"
                asChild
                forceMount
                onOpenAutoFocus={(event) => {
                  event.preventDefault();
                  requestAnimationFrame(() => {
                    contentRef.current?.focus({ preventScroll: true });
                  });
                }}
              >
                {isMobile
                  ? (
                    // ── Mobile bottom sheet ──────────────────────────────────
                    <motion.div
                      ref={contentRef}
                      tabIndex={-1}
                      drag="y"
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={{ top: 0, bottom: 0.85 }}
                      onDragEnd={(_, info) => {
                        if (info.offset.y > 120 || info.velocity.y > 400) onClose();
                      }}
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={mobileSpring}
                      className="fixed bottom-0 left-0 right-0"
                      style={{
                        zIndex: 51,
                        background: 'light-dark(#ffffff, #1c1c1e)',
                        borderRadius: '16px 16px 0 0',
                        boxShadow: '0 -12px 48px rgba(0,0,0,0.12)',
                        maxWidth: 520,
                        margin: '0 auto',
                        maxHeight: '88dvh',
                        height: '88dvh',
                        fontFamily: 'inherit',
                        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
                        display: 'flex',
                        flexDirection: 'column',
                        outline: 'none',
                      }}
                    >
                      <DialogPrimitive.Title className="sr-only">Settings</DialogPrimitive.Title>
                      <DialogPrimitive.Description className="sr-only">Configure your API credentials and appearance preferences</DialogPrimitive.Description>

                      {/* Drag handle */}
                      <div className="flex justify-center pt-2.5 pb-2 flex-shrink-0 cursor-grab">
                        <div className="w-11 h-[4px] rounded-full bg-foreground/35" />
                      </div>

                      {/* Sheet header */}
                      <div className={cn(
                        "flex items-center justify-between px-6 flex-shrink-0",
                        mobileView ? "pt-1 pb-4" : "h-0 overflow-hidden"
                      )}>
                        {mobileView ? (
                          <button
                            onClick={() => {
                              if (mobileViewHistoryEntryRef.current && window.history.state?.paradoxModalView) {
                                window.history.back();
                              } else {
                                setMobileView(null);
                              }
                            }}
                            className="flex items-center gap-1.5 text-[15px] font-medium text-foreground/60 hover:text-foreground transition-colors cursor-pointer active:scale-[0.96] select-none"
                          >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            <span>Settings</span>
                          </button>
                        ) : null}
                        <DialogPrimitive.Close asChild>
                          <button className={cn(
                            "w-7 h-7 flex items-center justify-center rounded-full bg-foreground/[0.07] text-foreground/50 hover:text-foreground transition-all cursor-pointer active:scale-[0.93]",
                            !mobileView && "hidden"
                          )}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </DialogPrimitive.Close>
                      </div>

                      {/* Sheet body */}
                      <div className="flex-1 overflow-hidden min-h-0 relative">
                        <AnimatePresence mode="wait" initial={false}>
                          {!mobileView ? (
                            // ── Grok-style flat tab list ──
                            <motion.div
                              key="mobile-tab-list"
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -16 }}
                              transition={{ duration: 0.18, ease: 'easeOut' }}
                              className="absolute inset-0 flex flex-col overflow-hidden"
                            >
                              <div className="px-6 pt-5">
                                {TABS.map((tab) => {
                                  const Icon = tab.icon;
                                  return (
                                    <button
                                      key={tab.id}
                                      onClick={() => setMobileView(tab.id)}
                                      className="w-full h-[50px] flex items-center justify-between text-left cursor-pointer select-none rounded-xl active:bg-foreground/[0.04] transition-colors duration-100"
                                    >
                                      <div className="flex items-center gap-4 min-w-0">
                                        <Icon className="w-[17px] h-[17px] text-foreground/45 flex-shrink-0" strokeWidth={1.9} />
                                        <span className="text-[17px] font-medium text-foreground/55 truncate">{tab.label}</span>
                                      </div>
                                      <ChevronRight className="w-[18px] h-[18px] text-foreground/45 flex-shrink-0" strokeWidth={1.9} />
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex-1" />
                            </motion.div>
                          ) : (
                            // Tab content
                            <motion.div
                              key={`mobile-content-${mobileView}`}
                              initial={{ opacity: 0, x: 16 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 16 }}
                              transition={{ duration: 0.18, ease: 'easeOut' }}
                              className="absolute inset-0 overflow-y-auto sidebar-scroll"
                            >
                              <div className="px-4 pt-2 pb-4 space-y-4">
                                <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                                  {TABS.find(t => t.id === mobileView)?.label}
                                </h3>
                                <TabContent
                                  activeTab={mobileView}
                                  apiKeys={apiKeys}
                                  inputKeys={inputKeys}
                                  setInputKeys={setInputKeys}
                                />
                              </div>
                              {/* Sticky save CTA */}
                              <div className="sticky bottom-0 px-4 py-4 pointer-events-none" style={{ background: 'linear-gradient(to top, light-dark(#ffffff, #1c1c1e) 60%, transparent)' }}>
                                <button
                                  onClick={handleSave}
                                  className="pointer-events-auto w-full h-12 rounded-2xl text-[14px] font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer active:scale-[0.98] shadow-sm"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                  : (
                    // ── Desktop centered modal ───────────────────────────────
                    <motion.div
                      ref={contentRef}
                      tabIndex={-1}
                      key="settings-desktop"
                      initial={{ opacity: 0, scale: 0.96, x: '-50%', y: 'calc(-50% - 18px)' }}
                      animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                      exit={{ opacity: 0, scale: 0.96, x: '-50%', y: 'calc(-50% - 18px)' }}
                      transition={desktopSpring}
                      className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[720px] h-[520px] bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl shadow-black/10 dark:shadow-black/60 rounded-[24px] overflow-hidden flex outline-none"
                      style={{ fontFamily: 'inherit' }}
                    >
                      <DialogPrimitive.Title className="sr-only">Settings</DialogPrimitive.Title>
                      <DialogPrimitive.Description className="sr-only">Configure your API credentials and appearance preferences</DialogPrimitive.Description>

                      {/* Left sidebar */}
                      <div className="w-[200px] flex-shrink-0 border-r border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-900/40 flex flex-col py-5 px-3 gap-1 select-none">
                        {TABS.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={cn(
                                'w-full h-[36px] px-3 rounded-xl flex items-center gap-2.5 text-[13px] font-medium transition-all duration-150 cursor-pointer text-left',
                                isActive
                                  ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm'
                                  : 'text-foreground/55 hover:text-foreground hover:bg-foreground/[0.04]'
                              )}
                            >
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.2} />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Right content pane */}
                      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        {/* Pane header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/60 flex-shrink-0">
                          <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
                            {TABS.find(t => t.id === activeTab)?.label}
                          </h2>
                          <DialogPrimitive.Close asChild>
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/[0.05] transition-all cursor-pointer active:scale-[0.93]">
                              <X className="w-4 h-4" />
                            </button>
                          </DialogPrimitive.Close>
                        </div>

                        {/* Scrollable tab content */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 sidebar-scroll min-h-0">
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={activeTab}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                            >
                              <TabContent
                                activeTab={activeTab}
                                apiKeys={apiKeys}
                                inputKeys={inputKeys}
                                setInputKeys={setInputKeys}
                              />
                            </motion.div>
                          </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/60 flex-shrink-0">
                          <DialogPrimitive.Close asChild>
                            <button className="h-8 px-4 rounded-lg text-[12px] font-medium text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] border border-transparent hover:border-border/40 transition-all cursor-pointer active:scale-[0.97]">
                              Cancel
                            </button>
                          </DialogPrimitive.Close>
                          <button
                            onClick={handleSave}
                            className="h-8 px-5 rounded-lg text-[12px] font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer active:scale-[0.97] shadow-sm"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                }
              </DialogPrimitive.Content>
            </>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
