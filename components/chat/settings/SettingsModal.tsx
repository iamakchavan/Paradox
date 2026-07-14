"use client";

import { AnimatePresence, motion } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopSettingsContent } from './modal/DesktopSettingsContent';
import { MobileSettingsContent } from './modal/MobileSettingsContent';
import { desktopSettingsSpring, mobileSettingsSpring } from './modal/settings-modal-config';
import type { SettingsModalProps } from './modal/types';
import { useSettingsModalController } from './modal/use-settings-modal-controller';
import { motionTransitions } from '@/lib/motion';
import { usePreparedEntrance } from '@/hooks/use-prepared-entrance';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const isMobile = useIsMobile();
  const mobileEntranceReady = usePreparedEntrance(isOpen && isMobile);
  const controller = useSettingsModalController({ isOpen, isMobile, onClose });

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={open => { if (!open && isOpen) controller.close(); }}
    >
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {isOpen && (
            <>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  key="settings-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={motionTransitions.overlay}
                  className={cn(
                    'fixed inset-0 z-50 bg-black/50',
                    !isMobile && 'dark:bg-black/70 backdrop-blur-[6px]'
                  )}
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content
                key="settings-content"
                asChild
                forceMount
                onOpenAutoFocus={event => {
                  event.preventDefault();
                  requestAnimationFrame(() => {
                    controller.contentRef.current?.focus({ preventScroll: true });
                  });
                }}
              >
                {isMobile ? (
                  <motion.div
                    ref={controller.contentRef}
                    tabIndex={-1}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 0.85 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.y > 120 || info.velocity.y > 400) onClose();
                    }}
                    initial={{ y: '100%' }}
                    animate={{ y: mobileEntranceReady ? 0 : '100%' }}
                    exit={{ y: '100%' }}
                    transition={mobileSettingsSpring}
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
                      backfaceVisibility: 'hidden',
                      willChange: 'transform',
                    }}
                  >
                    <MobileSettingsContent controller={controller} />
                  </motion.div>
                ) : (
                  <motion.div
                    ref={controller.contentRef}
                    tabIndex={-1}
                    key="settings-desktop"
                    initial={{ opacity: 0, scale: 0.96, x: '-50%', y: 'calc(-50% - 18px)' }}
                    animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                    exit={{ opacity: 0, scale: 0.96, x: '-50%', y: 'calc(-50% - 18px)' }}
                    transition={desktopSettingsSpring}
                    className="fixed left-1/2 top-1/2 z-50 flex h-[560px] w-[calc(100vw-2rem)] max-w-[780px] overflow-hidden rounded-[22px] border border-zinc-200/80 bg-white shadow-[0_28px_90px_rgba(0,0,0,0.18)] outline-none dark:border-white/10 dark:bg-zinc-950 dark:shadow-[0_28px_100px_rgba(0,0,0,0.65)]"
                    style={{ fontFamily: 'inherit' }}
                  >
                    <DesktopSettingsContent controller={controller} />
                  </motion.div>
                )}
              </DialogPrimitive.Content>
            </>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
