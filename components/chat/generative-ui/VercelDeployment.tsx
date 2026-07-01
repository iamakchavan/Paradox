import React from 'react';
import { ArrowUpRight, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VercelDeploymentProps {
  projectName?: string;
  status?: string;
  branch?: string;
  commitMessage?: string;
  creator?: string;
  duration?: string;
  deploymentUrl?: string;
}

export default function VercelDeployment({
  projectName = 'Vercel Project',
  status = 'ready',
  branch = 'main',
  commitMessage = 'No commit details',
  creator = 'system',
  duration = 'TBD',
  deploymentUrl,
}: VercelDeploymentProps) {
  // Map deployment status to visual labels
  const getStatusLabel = (stat: string) => {
    const term = stat.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (term.includes('build') || term.includes('progress') || term.includes('queue') || term.includes('pend')) {
      return 'Building';
    }
    if (term.includes('ready') || term.includes('success') || term.includes('done')) {
      return 'Ready';
    }
    if (term.includes('cancel')) {
      return 'Canceled';
    }
    return 'Failed';
  };

  const getStatusDotColor = (stat: string) => {
    const term = stat.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (term.includes('build') || term.includes('progress') || term.includes('queue') || term.includes('pend')) {
      return 'bg-blue-500 animate-pulse';
    }
    if (term.includes('ready') || term.includes('success') || term.includes('done')) {
      return 'bg-green-500';
    }
    if (term.includes('cancel')) {
      return 'bg-zinc-400';
    }
    return 'bg-red-500';
  };

  const displayCreator = creator.startsWith('@') ? creator : `@${creator}`;
  const displayUrl = deploymentUrl 
    ? deploymentUrl.replace(/^https?:\/\//, '') 
    : 'vercel.com';

  const statusLabel = getStatusLabel(status);
  const hasDuration = duration && 
    duration.toLowerCase() !== 'unknown' && 
    duration.toLowerCase() !== 'tbd' && 
    duration.trim() !== '';

  return (
    <div className="w-full max-w-[320px] sm:max-w-[350px] bg-zinc-50/20 dark:bg-zinc-950/5 border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl shadow-3xs overflow-hidden select-none text-foreground animate-in fade-in-50 duration-200">
      {/* Top Panel: Native-looking Vercel Deployment Card */}
      <div className="p-4 flex flex-col bg-white dark:bg-zinc-950">
        <div className="flex justify-between items-start mb-2">
          {/* Project Header */}
          <div className="flex flex-col min-w-0">
            <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 font-medium leading-none">
              Vercel Deployment
            </span>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1.5 truncate">
              {projectName}
            </span>
          </div>

          {/* Status Indicator: Borderless status dot */}
          <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 select-none">
            <span className={cn("w-1 h-1 rounded-full shrink-0", getStatusDotColor(status))} />
            <span>{statusLabel}</span>
          </div>
        </div>

        {/* Deployment Commit & Context */}
        <div className="flex flex-col min-w-0 mt-1">
          <p className="text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed line-clamp-2">
            {commitMessage}
          </p>

          {/* Developer-style log line for Branch, Duration, and Creator */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1.5 mt-3 text-[10.5px] text-zinc-400 dark:text-zinc-500 font-mono">
            {/* Branch Badge: Soft, borderless backdrop */}
            <div className="flex items-center gap-1 bg-zinc-100/60 dark:bg-zinc-900/60 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400">
              <GitBranch className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate max-w-[80px] font-semibold text-[10px]">{branch}</span>
            </div>
            
            <span>•</span>

            {/* Creator Badge: Clean, simple username */}
            <span className="font-semibold text-[10px] text-zinc-500 dark:text-zinc-400">{displayCreator}</span>

            {hasDuration && (
              <>
                <span>•</span>
                <span>{duration}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Dual-line action footer with square CTA button */}
      <div className="px-4 py-3 flex justify-between items-center bg-zinc-50/40 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-900/60">
        <div className="flex flex-col min-w-0 flex-1 mr-2">
          <span className="text-[13px] font-medium text-zinc-850 dark:text-zinc-200 tracking-tight leading-tight truncate">
            Visit Preview Deployment
          </span>
          <span className="text-[10.5px] font-mono text-muted-foreground mt-1 leading-normal truncate">
            {displayUrl}
          </span>
        </div>
        
        {deploymentUrl && (
          <a 
            href={deploymentUrl} 
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
