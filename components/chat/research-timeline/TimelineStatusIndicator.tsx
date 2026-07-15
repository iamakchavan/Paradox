"use client";

import { motion } from 'framer-motion';

export function TimelineStatusIndicator({
  isStepLoading,
  isCompleted,
  isFailed,
}: {
  isStepLoading: boolean;
  isCompleted: boolean;
  isFailed: boolean;
}) {
  return (
    <div className="w-5 h-5 flex items-center justify-center shrink-0 z-10 select-none">
      {isStepLoading ? (
        <div className="relative w-4 h-4 flex items-center justify-center">
          <motion.div
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="absolute w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-200"
          />
          <svg
            className="w-4 h-4 text-zinc-650 dark:text-zinc-350 animate-spin"
            viewBox="0 0 16 16"
            style={{ animationDuration: '2s' }}
          >
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>
        </div>
      ) : isFailed ? (
        <div className="flex h-4 w-4 items-center justify-center text-muted-foreground/55">
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M7 7l10 10M17 7L7 17" />
          </svg>
        </div>
      ) : isCompleted ? (
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-4 h-4 flex items-center justify-center"
        >
          <svg
            className="w-3.5 h-3.5 text-zinc-650 dark:text-zinc-350"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              d="M4 12L9 17L20 6"
            />
          </svg>
        </motion.div>
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-850" />
      )}
    </div>
  );
}
