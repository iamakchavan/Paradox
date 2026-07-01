import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export interface LinearProjectProps {
  name?: string;
  status?: string;
  progress?: string | number;
  lead?: string;
  targetDate?: string;
  completedIssues?: string | number;
  totalIssues?: string | number;
  link?: string;
}

export default function LinearProject({
  name = 'Unnamed Project',
  status = 'planned',
  progress = 0,
  lead = 'Unassigned',
  targetDate = 'No Target',
  completedIssues = 0,
  totalIssues = 0,
  link,
}: LinearProjectProps) {
  const displayLead = lead.startsWith('@') ? lead : `@${lead}`;
  
  // Format progress value cleanly
  const progressNum = typeof progress === 'number' 
    ? progress 
    : parseInt(progress?.toString().replace(/[^0-9]/g, '') || '0', 10);
  const cleanProgress = Math.max(0, Math.min(100, progressNum));

  // Parse issue counts
  const total = typeof totalIssues === 'number' 
    ? totalIssues 
    : parseInt(totalIssues?.toString().replace(/[^0-9]/g, '') || '0', 10);
  const completed = typeof completedIssues === 'number' 
    ? completedIssues 
    : parseInt(completedIssues?.toString().replace(/[^0-9]/g, '') || '0', 10);
  const remaining = Math.max(0, total - completed);

  // SVG Progress Ring calculations (r = 14, circumference = 2 * pi * r = ~88)
  const radius = 14;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanProgress / 100) * circumference;

  return (
    <div className="w-full max-w-[320px] sm:max-w-[350px] bg-zinc-50/20 dark:bg-zinc-950/5 border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl shadow-3xs overflow-hidden select-none text-foreground animate-in fade-in-50 duration-200">
      {/* Top Panel: Project Information & Progress Indicator */}
      <div className="p-4 flex justify-between items-start bg-white dark:bg-zinc-950">
        {/* Left Column: Project Name & Timeline details */}
        <div className="flex flex-col min-w-0 flex-1 mr-3">
          <span className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium leading-none">
            Linear Project
          </span>
          
          <span className="text-sm sm:text-base font-semibold tracking-tight text-foreground leading-tight mt-1.5 truncate">
            {name}
          </span>

          <span className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mt-1.5 leading-none truncate">
            Lead: {displayLead} · Due {targetDate}
          </span>
        </div>

        {/* Right Column: Progress Ring & Percent Value */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base sm:text-lg font-light font-mono tracking-tight text-foreground leading-none">
            {cleanProgress}%
          </span>
          
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="16"
                cy="16"
                r={radius}
                className="stroke-zinc-100 dark:stroke-zinc-800 fill-none"
                strokeWidth={strokeWidth}
              />
              {/* Active Progress Circle */}
              <circle
                cx="16"
                cy="16"
                r={radius}
                className="stroke-violet-500 fill-none transition-all duration-300"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Dual-line action footer with square CTA button */}
      <div className="px-4 py-3 flex justify-between items-center bg-zinc-50/40 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-900/60">
        <div className="flex flex-col min-w-0 flex-1 mr-2">
          <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 tracking-tight leading-tight truncate">
            View Project Roadmap
          </span>
          <span className="text-[10.5px] font-mono text-muted-foreground mt-1 leading-none truncate">
            {completed} completed • {remaining} remaining • {total} total
          </span>
        </div>
        
        {link && (
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
