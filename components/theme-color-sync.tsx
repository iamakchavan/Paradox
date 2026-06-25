"use client";

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === 'dark' ? '#09090b' : '#f7f5ef';
    
    // 1. Dynamic Meta Tag updating for browsers & PWA wrapper engines
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }, [resolvedTheme]);

  return null;
}
