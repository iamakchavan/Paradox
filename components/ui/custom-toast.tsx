'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Check, AlertCircle, Info, AlertTriangle, ClipboardCheck, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastOptions {
  message: string;
  title?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  mode?: 'capsule' | 'detail';
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useCustomToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useCustomToast must be used within a CustomToastProvider');
  }
  return context;
};

// Framer Motion spring preset
const springConfig = { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 };

function ToastComponent({
  toast,
  isMobile,
  onDismiss,
}: {
  toast: ToastItem;
  isMobile: boolean;
  onDismiss: (id: string) => void;
}) {
  const { id, message, title, type = 'info', mode: customMode, duration = 4000 } = toast;
  const mode = customMode || (title ? 'detail' : 'capsule');

  // Swipe exit direction state
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Timer pausing states
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);
  const isPausedRef = useRef<boolean>(false);

  const startTimer = useCallback((time: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    startTimeRef.current = Date.now();
    remainingTimeRef.current = time;
    timerRef.current = setTimeout(() => {
      onDismiss(id);
    }, time);
  }, [id, onDismiss]);

  const pauseTimer = useCallback(() => {
    if (isPausedRef.current) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    isPausedRef.current = true;
  }, []);

  const resumeTimer = useCallback(() => {
    if (!isPausedRef.current) return;
    isPausedRef.current = false;
    if (remainingTimeRef.current > 0) {
      startTimer(remainingTimeRef.current);
    } else {
      onDismiss(id);
    }
  }, [id, onDismiss, startTimer]);

  useEffect(() => {
    startTimer(duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, startTimer]);

  const handleDragEnd = (_e: any, info: PanInfo) => {
    if (!isMobile) return;
    const threshold = 80;
    const velocityThreshold = 150;

    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > threshold || velocity > velocityThreshold) {
      setSwipeDirection('right');
      setTimeout(() => onDismiss(id), 50);
    } else if (offset < -threshold || velocity < -velocityThreshold) {
      setSwipeDirection('left');
      setTimeout(() => onDismiss(id), 50);
    }
  };

  // Define Handoff Design Tokens
  const isDestructive = type === 'error';
  const glassStyle: React.CSSProperties = mode === 'capsule'
    ? {
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      }
    : {
        backgroundColor: 'hsla(var(--background) / 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: isDestructive ? '1px solid rgba(239, 68, 68, 0.22)' : '1px solid hsl(var(--border) / 0.65)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06)',
      };

  // Icon selector
  const getIcon = () => {
    const isCopy = type === 'success' && (message.toLowerCase().includes('copy') || message.toLowerCase().includes('copied'));
    if (isCopy) {
      return <ClipboardCheck className="w-[18px] h-[18px] stroke-[2] text-cyan-600 dark:text-cyan-400" />;
    }
    const isBranch = message.toLowerCase().includes('branch') || (title && title.toLowerCase().includes('branch'));
    if (isBranch) {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-[18px] h-[18px] text-cyan-650 dark:text-cyan-400 flex-shrink-0"
        >
          <path
            d="M6.02,5.78m0,15.31V4.55m0,0v-1.91m0,3.14v-1.23m0,1.23c0,1.61,1.21,3.11,3.2,3.94l4.58,1.92c1.98,.83,3.2,2.32,3.2,3.94v3.84"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20.53,17.59l-3.41,3.66-3.66-3.41"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    switch (type) {
      case 'success':
        return <Check className="w-[18px] h-[18px] stroke-[2.5] text-emerald-600 dark:text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-[18px] h-[18px] stroke-[2.5] text-amber-600 dark:text-amber-400" />;
      case 'error':
        return <AlertCircle className="w-[18px] h-[18px] stroke-[2.5] text-rose-600 dark:text-rose-450" />;
      case 'info':
      default:
        return <Info className="w-[18px] h-[18px] stroke-[2.5] text-blue-600 dark:text-blue-400" />;
    }
  };

  // Framer Motion presets from handoff
  const initialPreset = {
    opacity: 0,
    y: -30,
    scale: 0.94,
    filter: 'blur(5px)',
  };

  const animatePreset = {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
  };

  const exitPreset = {
    opacity: 0,
    x: swipeDirection === 'right' ? 240 : swipeDirection === 'left' ? -240 : 0,
    y: swipeDirection ? 0 : -20,
    scale: 0.94,
    filter: 'blur(2px)',
  };

  return (
    <motion.div
      layout
      drag={isMobile ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      onMouseEnter={!isMobile ? pauseTimer : undefined}
      onMouseLeave={!isMobile ? resumeTimer : undefined}
      onTouchStart={isMobile ? pauseTimer : undefined}
      onTouchEnd={isMobile ? resumeTimer : undefined}
      initial={initialPreset}
      animate={animatePreset}
      exit={exitPreset}
      transition={springConfig}
      style={glassStyle}
      className={cn(
        'w-full max-w-sm flex-shrink-0 text-foreground',
        mode === 'capsule' ? 'flex items-center justify-center' : 'rounded-full px-5 py-4 flex gap-4 items-center border relative'
      )}
    >
      {mode === 'capsule' ? (
        <div className="rounded-full p-[3px] bg-foreground/[0.03] border border-foreground/[0.06] backdrop-blur-md shadow-xl flex items-center justify-center">
          <div className="rounded-full px-4 py-2 bg-background border border-border flex items-center gap-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <span className="flex items-center justify-center">
              {getIcon()}
            </span>
            <span className="text-[12px] font-semibold tracking-tight text-foreground select-none leading-none">
              {message}
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Circular Icon Wrapper */}
          <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-foreground/[0.03] border border-foreground/[0.06]">
            {getIcon()}
          </div>

          {/* Text block */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            {title && (
              <h4 className="text-[13.5px] font-bold text-foreground tracking-tight leading-tight">
                {title}
              </h4>
            )}
            <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">
              {message}
            </p>
          </div>

          {/* Micro-interactive Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(id);
            }}
            className="text-foreground/30 hover:text-foreground/70 hover:bg-foreground/[0.04] p-1.5 rounded-full transition-all duration-150 cursor-pointer shrink-0 ml-1"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </motion.div>
  );
}

export function CustomToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 768px)');
    const updateMatch = () => setIsMobile(media.matches);
    updateMatch();
    media.addEventListener('change', updateMatch);
    return () => media.removeEventListener('change', updateMatch);
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...options, id }]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Center alignment for all toasts at the top of the screen
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    pointerEvents: 'auto',
    width: isMobile ? '90vw' : '360px',
    maxWidth: '360px',
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div style={containerStyle}>
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastComponent
              key={toast.id}
              toast={toast}
              isMobile={isMobile}
              onDismiss={dismissToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
