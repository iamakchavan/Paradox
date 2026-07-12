"use client";

import { ChevronLeft, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { FloatingIconButton } from '@/components/ui/floating-icon-button';
import type { MobileAttachSheetProps } from './types';
import type { MobileAttachController } from './use-mobile-attach-controller';
import { MobileAttachAppsView } from './MobileAttachAppsView';
import { MobileAttachMainView } from './MobileAttachMainView';

type MobileAttachSheetContentProps = Omit<MobileAttachSheetProps, 'isOpen' | 'onClose' | 'onManageConnectors'> & {
  controller: MobileAttachController;
};

export function MobileAttachSheetContent({
  controller,
  onAttachImage,
  onAttachDocument,
  searchEnabled,
  onToggleSearch,
  researchEnabled,
  onToggleResearch,
  activeApps,
  selectedMcpIds,
  onToggleMcpId,
}: MobileAttachSheetContentProps) {
  const { view, setView, selectedAppsCount, backToMain, manageConnectors } = controller;

  return (
    <>
      <DialogPrimitive.Title className="sr-only">Input actions</DialogPrimitive.Title>
      <DialogPrimitive.Description className="sr-only">
        Upload files, toggle modes, and manage apps
      </DialogPrimitive.Description>

      <div className="flex justify-center pt-3 pb-2">
        <div className="h-1 w-12 rounded-full bg-foreground/20" />
      </div>

      <div className="flex h-11 items-center justify-between px-4">
        {view === 'apps' ? (
          <button
            type="button"
            onClick={backToMain}
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
            <MobileAttachMainView
              onAttachImage={onAttachImage}
              onAttachDocument={onAttachDocument}
              searchEnabled={searchEnabled}
              onToggleSearch={onToggleSearch}
              researchEnabled={researchEnabled}
              onToggleResearch={onToggleResearch}
              activeApps={activeApps}
              selectedAppsCount={selectedAppsCount}
              onOpenApps={() => setView('apps')}
            />
          ) : (
            <MobileAttachAppsView
              activeApps={activeApps}
              selectedMcpIds={selectedMcpIds}
              onToggleMcpId={onToggleMcpId}
              onManageConnectors={manageConnectors}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
