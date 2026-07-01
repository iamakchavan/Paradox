import React from 'react';
import { Calendar, User, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MeetingCardProps {
  title?: string;
  host?: string;
  time?: string;
  duration?: string;
  status?: string;
  location?: string;
  link?: string;
}

export default function MeetingCard({
  title,
  host,
  time,
  duration,
  status = 'confirmed',
  location = 'Google Meet',
  link,
}: MeetingCardProps) {
  const hasTitle = !!title;
  const hasTime = !!time;

  const displayTitle = title || 'Meeting Schedule';
  const displayHost = host || 'Cal.com Event';
  const displayTime = time || 'TBD';
  const displayDuration = duration || '30 mins';
  const displayStatus = status || 'confirmed';
  const displayLocation = location || 'Google Meet';
  const displayLink = link || 'https://meet.google.com';

  const isConfirmed = displayStatus.toLowerCase() === 'confirmed';

  return (
    <div className="w-full max-w-[320px] sm:max-w-[350px] bg-zinc-50/20 dark:bg-zinc-950/5 border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl shadow-3xs overflow-hidden select-none text-foreground animate-in fade-in-50 duration-200">
      {/* Top Panel: Core Details */}
      <div className="p-4 flex flex-col gap-3 bg-white dark:bg-zinc-950">
        <div className="flex flex-col min-w-0">
          {hasTitle ? (
            <span className="text-[13px] font-semibold tracking-tight text-foreground leading-tight truncate">
              {displayTitle}
            </span>
          ) : (
            <div className="w-24 h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          )}
          
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1 leading-tight truncate">
            {displayLocation}
          </span>
        </div>

        {/* Sleek Line Divider */}
        <div className="h-[1px] bg-zinc-100 dark:bg-zinc-900 w-full" />

        {/* Details list */}
        <div className="flex flex-col gap-2 min-w-0">
          {/* Host info */}
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              {displayHost}
            </span>
          </div>

          {/* Time info */}
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
            {hasTime ? (
              <span className="text-[11px] font-mono text-muted-foreground font-semibold truncate">
                {displayTime}
              </span>
            ) : (
              <div className="w-20 h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Action CTA */}
      <div className="px-4 py-3 flex justify-between items-center bg-zinc-50/40 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-900/60">
        <div className="flex flex-col min-w-0 flex-1 mr-2">
          <span className="text-xs font-semibold tracking-tight text-foreground leading-tight truncate">
            Join on {displayLocation}
          </span>
          <span className="text-[9.5px] font-mono text-muted-foreground mt-1 leading-tight truncate">
            {displayDuration} • {isConfirmed ? 'Confirmed' : displayStatus}
          </span>
        </div>
        
        {/* Real video anchor link */}
        <a 
          href={displayLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
        >
          <Video className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
