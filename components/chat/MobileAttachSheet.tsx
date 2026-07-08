import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Image, Plus, Puzzle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { FloatingIconButton } from '@/components/ui/floating-icon-button';
import { useMobileBackDismiss } from '@/hooks/use-mobile-back-dismiss';
import { PROVIDER_LOGOS } from '@/components/chat/integrations/IntegrationsTab';
import type { MCPIntegration } from '@/lib/db';

const DeepResearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12.2429 6.18353L8.55917 8.27415C7.72801 8.74586 7.31243 8.98172 7.20411 9.38603C7.09579 9.79034 7.33779 10.2024 7.82179 11.0264L8.41749 12.0407C8.88853 12.8427 9.12405 13.2437 9.51996 13.3497C9.91586 13.4558 10.3203 13.2263 11.1292 12.7672L14.8646 10.6472M7.05634 9.72257L3.4236 11.7843C2.56736 12.2702 2.13923 12.5132 2.02681 12.9256C1.91438 13.3381 2.16156 13.7589 2.65591 14.6006C3.15026 15.4423 3.39744 15.8631 3.81702 15.9736C4.2366 16.0842 4.66472 15.8412 5.52096 15.3552L9.1537 13.2935M21.3441 5.18488L20.2954 3.39939C19.8011 2.55771 19.5539 2.13687 19.1343 2.02635C18.7147 1.91584 18.2866 2.15881 17.4304 2.64476L13.7467 4.73538C12.9155 5.20709 12.4999 5.44294 12.3916 5.84725C12.2833 6.25157 12.5253 6.6636 13.0093 7.48766L14.1293 9.39465C14.6004 10.1966 14.8359 10.5976 15.2318 10.7037C15.6277 10.8098 16.0322 10.5802 16.841 10.1212L20.5764 8.00122C21.4326 7.51527 21.8608 7.2723 21.9732 6.85985C22.0856 6.44741 21.8384 6.02657 21.3441 5.18488Z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M12 12.5L16 22" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    <path d="M12 12.5L8 22" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
);

const WebSearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" stroke="currentColor" strokeWidth={1.5} />
    <path d="M17.8486 6.19085C19.8605 5.81929 21.3391 5.98001 21.8291 6.76327C22.8403 8.37947 19.2594 12.0342 13.8309 14.9264C8.40242 17.8185 3.18203 18.8529 2.17085 17.2367C1.63758 16.3844 2.38148 14.9651 4 13.3897" stroke="currentColor" strokeWidth={1.5} />
  </svg>
);

interface MobileAttachSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachImage: () => void;
  onAttachDocument: () => void;
  searchEnabled: boolean;
  onToggleSearch?: (enabled: boolean) => void;
  researchEnabled: boolean;
  onToggleResearch?: (enabled: boolean) => void;
  activeApps: MCPIntegration[];
  selectedMcpIds: string[];
  onToggleMcpId: (id: string) => void;
  onManageConnectors: () => void;
}

function SwitchPill({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-out',
        checked ? 'bg-foreground' : 'bg-zinc-300 dark:bg-zinc-700'
      )}
    >
      <span
        className={cn(
          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-200 ease-out',
          checked && 'translate-x-5'
        )}
      />
    </span>
  );
}

function ActionTile({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[92px] min-w-[116px] flex-1 flex-col justify-center rounded-[24px] bg-foreground/[0.055] px-4 text-left transition-colors active:bg-foreground/[0.09] dark:bg-white/[0.055] dark:active:bg-white/[0.09]"
    >
      <span className="mb-3 flex h-6 w-6 items-center justify-center text-foreground/68 dark:text-foreground/76">
        {icon}
      </span>
      <span className="text-[15px] font-medium leading-tight text-foreground">{label}</span>
    </button>
  );
}

function OptionRow({
  icon,
  label,
  checked,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[54px] w-full items-center justify-between gap-4 rounded-2xl px-2 text-left [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-foreground/62">
          {icon}
        </span>
        <span className="truncate text-[15px] font-medium leading-tight text-foreground">{label}</span>
      </span>
      <SwitchPill checked={checked} />
    </button>
  );
}

function AppsRow({
  app,
  selected,
  onToggle,
}: {
  app: MCPIntegration;
  selected: boolean;
  onToggle: () => void;
}) {
  const AppIcon = PROVIDER_LOGOS[app.id] || Puzzle;
  const isCustom = !PROVIDER_LOGOS[app.id];

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex min-h-[56px] w-full items-center justify-between gap-4 rounded-2xl px-3.5 text-left [-webkit-tap-highlight-color:transparent] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
    >
      <span className="flex min-w-0 items-center gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center">
          {isCustom ? (
            <AppIcon className="h-4 w-4 text-foreground/65" strokeWidth={1.7} />
          ) : (
            <AppIcon className="h-4 w-4" />
          )}
        </span>
        <span className="truncate text-[15px] font-medium text-foreground">{app.name}</span>
      </span>
      <SwitchPill checked={selected} />
    </button>
  );
}

export function MobileAttachSheet({
  isOpen,
  onClose,
  onAttachImage,
  onAttachDocument,
  searchEnabled,
  onToggleSearch,
  researchEnabled,
  onToggleResearch,
  activeApps,
  selectedMcpIds,
  onToggleMcpId,
  onManageConnectors,
}: MobileAttachSheetProps) {
  const [view, setView] = useState<'main' | 'apps'>('main');
  const viewRef = useRef<'main' | 'apps'>('main');
  const viewHistoryEntryRef = useRef<string | null>(null);
  const isManagingConnectorsRef = useRef(false);
  const selectedAppsCount = useMemo(
    () => activeApps.filter((app) => selectedMcpIds.includes(app.id)).length,
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

  const handleBackToMain = useCallback(() => {
    const viewEntryId = viewHistoryEntryRef.current;

    if (
      viewEntryId &&
      typeof window !== 'undefined' &&
      window.history.state?.paradoxMobileAttachSheetView === viewEntryId
    ) {
      window.history.back();
      return;
    }

    viewHistoryEntryRef.current = null;
    setView('main');
  }, []);

  const handleBeforeDismiss = useCallback((event: PopStateEvent) => {
    if (isManagingConnectorsRef.current) {
      return false;
    }

    const viewEntryId = viewHistoryEntryRef.current;

    if (
      viewRef.current === 'apps' &&
      viewEntryId &&
      event.state?.paradoxMobileAttachSheetView !== viewEntryId
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
      viewEntryId &&
      typeof window !== 'undefined' &&
      window.history.state?.paradoxMobileAttachSheetView === viewEntryId
    ) {
      return -2;
    }

    return -1;
  }, []);

  const handleManageConnectors = useCallback(() => {
    if (typeof window === 'undefined') {
      onManageConnectors();
      return;
    }

    const state = window.history.state || {};
    const hasSheetHistory = state.paradoxMobileAttachSheet || state.paradoxMobileAttachSheetView;

    if (!hasSheetHistory) {
      onManageConnectors();
      return;
    }

    isManagingConnectorsRef.current = true;

    const handleHistoryCleaned = () => {
      window.removeEventListener('popstate', handleHistoryCleaned);
      window.setTimeout(() => {
        isManagingConnectorsRef.current = false;
        onManageConnectors();
      }, 0);
    };

    window.addEventListener('popstate', handleHistoryCleaned);
    window.history.go(getDismissHistoryDelta());
  }, [getDismissHistoryDelta, onManageConnectors]);

  useMobileBackDismiss({
    isOpen,
    isMobile: true,
    stateKey: 'paradoxMobileAttachSheet',
    entryPrefix: 'mobile-attach-sheet',
    onDismiss: onClose,
    onBeforeDismiss: handleBeforeDismiss,
    getDismissHistoryDelta,
  });
  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-0 z-50 bg-black/45"
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.82 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 110 || info.velocity.y > 360) onClose();
                }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
                className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[78dvh] max-w-[520px] flex-col overflow-hidden rounded-t-[30px] border border-border/60 border-b-0 bg-background shadow-[0_-18px_70px_rgba(0,0,0,0.24)] outline-none dark:border-white/[0.08] dark:bg-[#151517] dark:shadow-[0_-18px_70px_rgba(0,0,0,0.55)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
              >
                <DialogPrimitive.Title className="sr-only">Input actions</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">Upload files, toggle modes, and manage apps</DialogPrimitive.Description>

                <div className="flex justify-center pt-3 pb-2">
                  <div className="h-1 w-12 rounded-full bg-foreground/20" />
                </div>

                <div className="flex h-11 items-center justify-between px-4">
                  {view === 'apps' ? (
                    <button
                      type="button"
                      onClick={handleBackToMain}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/65 transition-colors active:bg-foreground/[0.06]"
                      aria-label="Back to actions"
                    >
                      <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                    </button>
                  ) : (
                    <div className="h-9 w-9" />
                  )}

                  <h2 className="text-[16px] font-medium tracking-tight text-foreground">
                    {view === 'apps' ? 'Apps' : 'Add to chat'}
                  </h2>

                  <DialogPrimitive.Close asChild>
                    <FloatingIconButton aria-label="Close actions">
                      <X className="h-3.5 w-3.5" />
                    </FloatingIconButton>
                  </DialogPrimitive.Close>
                </div>

                <div className="relative overflow-hidden">
                  <AnimatePresence initial={false} mode="wait">
                    {view === 'main' ? (
                      <motion.div
                        key="main"
                        initial={{ x: -22, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -22, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="h-full overflow-y-auto px-4 pb-5 pt-2 sidebar-scroll"
                      >
                        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                          <ActionTile
                            icon={<Image className="h-4 w-4" strokeWidth={1.8} />}
                            label="Images"
                            onClick={onAttachImage}
                          />
                          <ActionTile
                            icon={<FileText className="h-4 w-4" strokeWidth={1.8} />}
                            label="Files"
                            onClick={onAttachDocument}
                          />
                        </div>

                        <div className="mt-4 divide-y divide-border/45">
                          <OptionRow
                            icon={<WebSearchIcon className="h-4 w-4" />}
                            label="Web search"
                            checked={searchEnabled}
                            onClick={() => onToggleSearch?.(!searchEnabled)}
                          />
                          <OptionRow
                            icon={<DeepResearchIcon className="h-4 w-4" />}
                            label="Deep research"
                            checked={researchEnabled}
                            onClick={() => onToggleResearch?.(!researchEnabled)}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setView('apps')}
                          className="mt-2 flex min-h-[58px] w-full items-center justify-between gap-4 rounded-2xl px-2 text-left transition-colors active:bg-foreground/[0.05]"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center text-foreground/62">
                              <Puzzle className="h-4 w-4" strokeWidth={1.8} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[15px] font-medium leading-tight text-foreground">Apps</span>
                              <span className="mt-0.5 block truncate text-[12px] font-medium leading-tight text-muted-foreground">
                                {activeApps.length > 0
                                  ? `${selectedAppsCount} selected from ${activeApps.length}`
                                  : 'Connect and manage apps'}
                              </span>
                            </span>
                          </span>
                          <ChevronRight className="h-5 w-5 shrink-0 text-foreground/40" strokeWidth={1.8} />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="apps"
                        initial={{ x: 24, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 24, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="flex flex-col overflow-hidden px-4 pb-5 pt-2"
                      >
                        <div className="mb-3 px-6 text-center text-[13px] font-medium leading-relaxed text-muted-foreground">
                          Choose which connected apps can be used in this chat
                        </div>

                        <div className="max-h-[332px] overflow-y-auto rounded-[22px] bg-foreground/[0.035] p-1 dark:bg-white/[0.035] sidebar-scroll">
                          {activeApps.length === 0 ? (
                            <div className="flex min-h-[148px] flex-col items-center justify-center px-6 text-center">
                              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground/[0.06] text-foreground/55 dark:bg-white/[0.06]">
                                <Puzzle className="h-5 w-5" strokeWidth={1.7} />
                              </div>
                              <div className="text-[15px] font-semibold text-foreground">No apps connected</div>
                              <div className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
                                Add connectors from settings to use them here.
                              </div>
                            </div>
                          ) : (
                            activeApps.map((app) => (
                              <AppsRow
                                key={app.id}
                                app={app}
                                selected={selectedMcpIds.includes(app.id)}
                                onToggle={() => onToggleMcpId(app.id)}
                              />
                            ))
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleManageConnectors}
                          className="mt-4 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[22px] bg-cyan-500/[0.08] text-[14px] font-semibold text-cyan-700 transition-colors active:bg-cyan-500/[0.13] dark:text-cyan-300"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2} />
                          Manage connectors
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}
