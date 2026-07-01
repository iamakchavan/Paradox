import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EventCardProps {
  title?: string;
  description?: string;
  duration?: string;
  slug?: string;
  link?: string;
}

export default function EventCard({
  title,
  description,
  duration,
  slug,
  link,
}: EventCardProps) {
  const hasTitle = !!title;
  const hasDuration = !!duration;

  const displayTitle = title || 'Event Template';
  const displayDescription = description || 'Book a slot directly with me.';
  const displayDuration = duration || '30 mins';
  const displayLink = link || 'https://cal.com';

  // Format duration text cleanly (e.g., "15 mins slot duration" -> "15 mins")
  const durationText = displayDuration
    .replace('slot duration', '')
    .replace('duration', '')
    .trim();

  return (
    <div className="w-full max-w-[320px] sm:max-w-[350px] bg-zinc-50/20 dark:bg-zinc-950/5 border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl shadow-3xs overflow-hidden select-none text-foreground animate-in fade-in-50 duration-200">
      {/* Top Panel: Header and Duration Tag */}
      <div className="p-3.5 flex items-center justify-between gap-3 bg-white dark:bg-zinc-950">
        <div className="flex flex-col min-w-0 flex-1">
          {hasTitle ? (
            <span className="text-[13px] font-semibold tracking-tight text-foreground leading-tight truncate">
              {displayTitle}
            </span>
          ) : (
            <div className="w-24 h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          )}
          
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1 leading-tight">
            Cal.com Template
          </span>
        </div>

        {hasDuration && (
          <span className="text-[9.5px] font-mono font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 text-muted-foreground px-1.5 py-0.5 rounded-md shrink-0">
            {durationText}
          </span>
        )}
      </div>

      {/* Bottom Panel: Description & Action Button */}
      <div className="px-3.5 py-2.5 flex justify-between items-center gap-4 bg-zinc-50/40 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-900/60">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
            {displayDescription}
          </span>
        </div>
        
        {/* Real booking redirect anchor link */}
        <a 
          href={displayLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
