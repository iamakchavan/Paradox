import { useState, useEffect, useCallback } from 'react';

/**
 * useVisualViewport — Production-grade hook for mobile keyboard-aware positioning.
 *
 * On mobile browsers, the virtual keyboard does NOT reliably resize the layout
 * viewport. This means `position: fixed; bottom: 0` elements get pushed behind
 * the keyboard. The Visual Viewport API provides the *actual* visible area.
 *
 * This hook:
 * 1. Listens to `window.visualViewport` resize/scroll events
 * 2. Calculates the keyboard height as the difference between the layout
 *    viewport (`window.innerHeight`) and the visual viewport height
 * 3. Returns a `bottomOffset` value to apply to fixed-bottom elements
 * 4. Also sets a CSS custom property on the document root for CSS-only consumers
 *
 * On desktop or when the keyboard is not open, `bottomOffset` is 0.
 */
export function useVisualViewport() {
  const [bottomOffset, setBottomOffset] = useState(0);

  const updateViewport = useCallback(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const keyboardHeight = window.innerHeight - vv.height;
    const offset = (isMobileDevice && keyboardHeight > 100) ? keyboardHeight : 0;

    setBottomOffset(offset);

    // Also set as CSS custom property for CSS-only consumers
    document.documentElement.style.setProperty(
      '--visual-viewport-offset-bottom',
      `${offset}px`
    );
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    // Use both resize and scroll events — iOS fires scroll when the
    // viewport pans to keep the focused input visible
    vv.addEventListener('resize', updateViewport);
    vv.addEventListener('scroll', updateViewport);

    // Initial check
    updateViewport();

    return () => {
      vv.removeEventListener('resize', updateViewport);
      vv.removeEventListener('scroll', updateViewport);

      // Reset custom property on cleanup
      document.documentElement.style.setProperty(
        '--visual-viewport-offset-bottom',
        '0px'
      );
    };
  }, [updateViewport]);

  return { bottomOffset };
}
