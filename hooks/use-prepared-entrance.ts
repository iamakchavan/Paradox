"use client";

import { useEffect, useState } from 'react';

/**
 * Gives newly mounted motion surfaces one painted frame to establish their
 * offscreen state and compositor layer before the entrance begins.
 */
export function usePreparedEntrance(active: boolean) {
  const [isPrepared, setIsPrepared] = useState(false);

  useEffect(() => {
    if (!active) {
      setIsPrepared(false);
      return;
    }

    let preparationFrame = 0;
    let entranceFrame = 0;

    preparationFrame = window.requestAnimationFrame(() => {
      entranceFrame = window.requestAnimationFrame(() => {
        setIsPrepared(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(preparationFrame);
      window.cancelAnimationFrame(entranceFrame);
    };
  }, [active]);

  return isPrepared;
}
