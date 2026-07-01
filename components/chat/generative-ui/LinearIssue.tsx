import React from 'react';
import { CheckCircle2, Circle, CircleDot, CircleDashed, XCircle, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LinearIssueProps {
  id?: string;
  title?: string;
  project?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  cycle?: string;
  dueDate?: string;
  link?: string;
}

export default function LinearIssue({
  id = 'Issue',
  title = 'No Title',
  project = 'Linear Project',
  status = 'todo',
  priority = 'medium',
  assignee = 'Unassigned',
  cycle,
  dueDate,
  link,
}: LinearIssueProps) {
  // Map normalized priority tags
  const getPriorityLabel = (pri: string) => {
    const term = pri.toLowerCase().trim();
    if (term === 'urgent') return 'Urgent';
    if (term === 'high') return 'High';
    if (term === 'medium') return 'Medium';
    if (term === 'low') return 'Low';
    return 'None';
  };

  // Map status to Linear's signature icons and colors
  const getStatusDetails = (stat: string) => {
    const term = stat.toLowerCase().replace(/[^a-z0-9]/g, '');
    const iconClass = "w-4 h-4 shrink-0 stroke-[2]";
    
    if (term.includes('backlog')) {
      return {
        label: 'Backlog',
        icon: <CircleDashed className={cn(iconClass, "text-zinc-400")} />
      };
    }
    if (term.includes('inprogress') || term.includes('started')) {
      return {
        label: 'In Progress',
        icon: <CircleDot className={cn(iconClass, "text-orange-500")} />
      };
    }
    if (term.includes('done') || term.includes('complete')) {
      return {
        label: 'Done',
        icon: <CheckCircle2 className={cn(iconClass, "text-violet-500")} />
      };
    }
    if (term.includes('cancel')) {
      return {
        label: 'Canceled',
        icon: <XCircle className={cn(iconClass, "text-red-500")} />
      };
    }
    return {
      label: 'Todo',
      icon: <Circle className={cn(iconClass, "text-blue-500")} />
    };
  };

  const statusInfo = getStatusDetails(status);
  const priorityLabel = getPriorityLabel(priority);
  
  // Clean assignee fallback to prevent single "@" outputs
  const cleanAssignee = !assignee || assignee.trim() === '' || assignee.toLowerCase() === 'unassigned'
    ? 'Unassigned'
    : assignee.startsWith('@') ? assignee : `@${assignee}`;
    
  const displayTimeline = cycle || dueDate || 'No Target';

  // Get text color code for priority values
  const getPriorityColor = (pri: string) => {
    const term = pri.toLowerCase().trim();
    if (term === 'urgent') return 'text-red-500 dark:text-red-400 font-semibold';
    if (term === 'high') return 'text-orange-500 dark:text-orange-400 font-semibold';
    if (term === 'medium') return 'text-zinc-700 dark:text-zinc-300 font-semibold';
    return 'text-zinc-500 dark:text-zinc-400 font-medium';
  };

  return (
    <div className="w-full max-w-[320px] sm:max-w-[350px] bg-zinc-50/20 dark:bg-zinc-950/5 border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl shadow-3xs overflow-hidden select-none text-foreground animate-in fade-in-50 duration-200">
      {/* Top Panel: Core Issue Info & Details List */}
      <div className="p-4 flex flex-col gap-3 bg-white dark:bg-zinc-950">
        <div className="flex justify-between items-start">
          {/* Left: Project context & Issue Title */}
          <div className="flex flex-col min-w-0 flex-1 mr-3">
            <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 font-medium leading-none truncate">
              {project}
            </span>
            <span className="text-sm sm:text-base font-semibold tracking-tight text-foreground leading-tight mt-1.5 line-clamp-2">
              {title}
            </span>
          </div>

          {/* Right: Status Badge */}
          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
            {statusInfo.icon}
            <span className="leading-none">
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Sleek Line Divider */}
        <div className="h-[1px] bg-zinc-100 dark:bg-zinc-900 w-full" />

        {/* Structured Key-Value Detail Block */}
        <div className="flex flex-col gap-2 min-w-0 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-zinc-450 dark:text-zinc-500 font-medium">Priority</span>
            <span className={getPriorityColor(priority)}>{priorityLabel}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-450 dark:text-zinc-500 font-medium">Target</span>
            <span className="text-foreground font-semibold">{displayTimeline === 'No Target' ? 'No target date' : displayTimeline}</span>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Dual-line action footer with square CTA button */}
      <div className="px-4 py-3 flex justify-between items-center bg-zinc-50/40 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-900/60">
        <div className="flex flex-col min-w-0 flex-1 mr-2">
          <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 tracking-tight leading-tight truncate">
            Open Issue in Linear
          </span>
          <span className="text-[10.5px] font-mono text-muted-foreground mt-1 leading-normal truncate">
            {id.toUpperCase()} • {cleanAssignee}
          </span>
        </div>
        
        {link && (
          <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 text-zinc-500 dark:text-zinc-450 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          </a>
        )}
      </div>
    </div>
  );
}
