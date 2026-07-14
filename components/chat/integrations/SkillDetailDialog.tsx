"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatToolName } from './integration-utils';
import type { IntegrationToolView } from './use-integrations-view-model';

export function SkillDetailDialog({ skill, onClose }: { skill: IntegrationToolView | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(skill)} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="w-[92%] max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 text-foreground font-sans rounded-[20px] p-6 [&>button]:hidden focus:outline-none focus-visible:outline-none animate-in fade-in-50 zoom-in-95 duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3.5 border-b border-zinc-100 dark:border-zinc-900/60 w-full text-left">
          <div className="flex flex-col min-w-0">
            <DialogTitle className="text-base font-bold text-zinc-800 dark:text-zinc-200 break-words pr-2">{skill ? formatToolName(skill.name) : ''}</DialogTitle>
            <DialogDescription className="text-xs font-mono text-zinc-400 dark:text-zinc-550 mt-1.5 break-all">{skill?.name}</DialogDescription>
          </div>
          <span className="self-start sm:self-center text-[10px] bg-zinc-50 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 px-2.5 py-0.5 rounded-md font-semibold shrink-0 border border-zinc-200/60 dark:border-zinc-800 select-none">{skill?.integrationName}</span>
        </div>
        <div className="mt-5 space-y-4 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar text-left">
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 block">Description</span>
            <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed font-normal">{skill?.description}</p>
          </div>
          {skill?.inputSchema && Object.keys(skill.inputSchema.properties || {}).length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 block">Input Parameters</span>
              <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-350 bg-zinc-50 dark:bg-zinc-900/50 p-4.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 overflow-x-auto">
                <pre className="whitespace-pre-wrap leading-relaxed font-mono">{JSON.stringify(skill.inputSchema.properties, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" type="button" onClick={onClose} className="h-8 px-4 rounded-full text-xs font-medium border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-[background-color,border-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] active:scale-[0.98] motion-reduce:transform-none">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
