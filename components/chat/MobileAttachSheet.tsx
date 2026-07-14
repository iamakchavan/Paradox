"use client";

import { AnimatePresence, motion } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { MobileAttachSheetContent } from './mobile-attach/MobileAttachSheetContent';
import type { MobileAttachSheetProps } from './mobile-attach/types';
import { useMobileAttachController } from './mobile-attach/use-mobile-attach-controller';
import { motionTransitions } from '@/lib/motion';

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
  const controller = useMobileAttachController({
    isOpen,
    onClose,
    activeApps,
    selectedMcpIds,
    onManageConnectors,
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
                transition={motionTransitions.overlay}
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
                transition={motionTransitions.drawer}
                className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[78dvh] max-w-[520px] flex-col overflow-hidden rounded-t-[30px] border border-border/60 border-b-0 bg-background shadow-[0_-18px_70px_rgba(0,0,0,0.24)] outline-none dark:border-white/[0.08] dark:bg-[#151517] dark:shadow-[0_-18px_70px_rgba(0,0,0,0.55)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
              >
                <MobileAttachSheetContent
                  controller={controller}
                  onAttachImage={onAttachImage}
                  onAttachDocument={onAttachDocument}
                  searchEnabled={searchEnabled}
                  onToggleSearch={onToggleSearch}
                  researchEnabled={researchEnabled}
                  onToggleResearch={onToggleResearch}
                  activeApps={activeApps}
                  selectedMcpIds={selectedMcpIds}
                  onToggleMcpId={onToggleMcpId}
                />
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}
