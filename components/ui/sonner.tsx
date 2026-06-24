'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

import { useState, useEffect } from 'react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const [position, setPosition] = useState<'top-center' | 'bottom-center'>('top-center');

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const updatePosition = () => {
      setPosition(media.matches ? 'bottom-center' : 'top-center');
    };
    updatePosition();
    media.addEventListener('change', updatePosition);
    return () => media.removeEventListener('change', updatePosition);
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position={position}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
