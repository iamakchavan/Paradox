"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { motionTransitions } from "@/lib/motion";
import { usePreparedEntrance } from "@/hooks/use-prepared-entrance";

interface MobileBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExitComplete?: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function MobileBottomSheet({
  open,
  onOpenChange,
  onExitComplete,
  title,
  description,
  children,
  className,
}: MobileBottomSheetProps) {
  const entranceReady = usePreparedEntrance(open);

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open && (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={motionTransitions.overlay}
                className="fixed inset-0 z-[70] bg-black/45"
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.82 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 110 || info.velocity.y > 360) {
                    onOpenChange(false);
                  }
                }}
                initial={{ y: "100%" }}
                animate={{ y: entranceReady ? 0 : "100%" }}
                exit={{ y: "100%", transition: motionTransitions.mobileSheetExit }}
                transition={motionTransitions.mobileSheetEnter}
                className={cn(
                  "progressive-blur-panel-surface fixed bottom-0 left-0 right-0 z-[70] mx-auto flex max-w-[520px] flex-col overflow-hidden rounded-t-[24px] border border-b-0 border-border/60 bg-background shadow-[0_-18px_70px_rgba(0,0,0,0.24)] outline-none [backface-visibility:hidden] [contain:layout] will-change-transform dark:border-white/[0.08] dark:bg-[hsl(var(--surface-panel))] dark:shadow-[0_-18px_70px_rgba(0,0,0,0.48)]",
                  className
                )}
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
              >
                <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
                {description ? (
                  <DialogPrimitive.Description className="sr-only">
                    {description}
                  </DialogPrimitive.Description>
                ) : null}

                <div className="mx-auto mb-2 mt-3 h-1 w-12 shrink-0 rounded-full bg-foreground/20" />
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}
