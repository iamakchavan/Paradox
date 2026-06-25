import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div className="relative flex items-center justify-center">
      <svg
        className={cn("text-muted-foreground/80 dark:text-muted-foreground", className)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        style={{ width: '1.25rem', height: '1.25rem' }}
      >
        <style>{`
          @keyframes system-spinner {
            0% { opacity: 1; }
            100% { opacity: 0.15; }
          }
          .spinner-bar {
            animation: system-spinner 0.8s linear infinite;
            fill: currentColor;
          }
        `}</style>
        {[...Array(8)].map((_, i) => (
          <rect
            key={i}
            className="spinner-bar"
            x="11"
            y="3"
            width="2"
            height="6"
            rx="1"
            style={{
              transform: `rotate(${i * 45}deg)`,
              transformOrigin: '12px 12px',
              animationDelay: `${-0.1 * i}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
