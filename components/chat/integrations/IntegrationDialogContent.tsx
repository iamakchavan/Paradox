'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { FloatingIconButton } from '@/components/ui/floating-icon-button';
import { cn } from '@/lib/utils';

export const integrationDialogPanelClass =
  'w-[92%] max-w-[520px] overflow-hidden rounded-[24px] border border-zinc-200/80 bg-white p-0 text-foreground shadow-[0_24px_80px_rgba(0,0,0,0.22)] focus:outline-none focus-visible:outline-none dark:border-white/[0.09] dark:bg-[hsl(var(--surface-panel))] dark:shadow-[0_28px_90px_rgba(0,0,0,0.55)]';

export const IntegrationDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="integration-dialog-overlay fixed inset-0 z-50 bg-black/55 dark:bg-black/70" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'integration-dialog-content fixed inset-0 z-50 m-auto h-fit outline-none',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));

IntegrationDialogContent.displayName = 'IntegrationDialogContent';

export function IntegrationDialogHeader({
  title,
  description,
  leading,
  onClose,
  closeLabel,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  leading?: React.ReactNode;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <div className="flex w-full items-start justify-between gap-5 px-7 pb-5 pt-7 text-left">
      <div className="flex min-w-0 items-center gap-3.5">
        {leading}
        <div className="min-w-0">
          <DialogPrimitive.Title className="truncate text-[17px] font-semibold leading-6 tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
            {description}
          </DialogPrimitive.Description>
        </div>
      </div>
      <FloatingIconButton
        onClick={onClose}
        aria-label={closeLabel}
        className="h-8 w-8 outline-none focus-visible:ring-2 focus-visible:ring-foreground/15"
      >
        <X className="h-3.5 w-3.5" />
      </FloatingIconButton>
    </div>
  );
}

export function IntegrationDialogFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t border-zinc-200/60 px-7 py-4 dark:border-white/[0.07]',
        className,
      )}
    >
      {children}
    </div>
  );
}
