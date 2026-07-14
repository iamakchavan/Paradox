'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export const IntegrationDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="integration-dialog-overlay fixed inset-0 z-50 bg-black/80" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'integration-dialog-content fixed left-1/2 top-1/2 z-50 outline-none',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));

IntegrationDialogContent.displayName = 'IntegrationDialogContent';
