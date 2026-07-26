"use client";

import { useRef } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { FloatingIconButton } from '@/components/ui/floating-icon-button';
import { formatToolName } from './integration-utils';
import { IntegrationDialogContent } from './IntegrationDialogContent';
import type { IntegrationToolView } from './use-integrations-view-model';

export function SkillDetailDialog({ skill, onClose }: { skill: IntegrationToolView | null; onClose: () => void }) {
  const retainedSkill = useRef(skill);
  if (skill) retainedSkill.current = skill;
  const renderedSkill = skill ?? retainedSkill.current;

  return (
    <Dialog open={Boolean(skill)} onOpenChange={open => { if (!open) onClose(); }}>
      <IntegrationDialogContent className="w-[92%] max-w-xl overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 text-foreground shadow-2xl focus:outline-none focus-visible:outline-none dark:border-white/[0.09] dark:bg-[hsl(var(--surface-panel))]">
        <div className="flex items-start justify-between gap-4 px-6 pb-5 pt-6 text-left">
          <div className="min-w-0 pt-0.5">
            <DialogTitle className="break-words pr-2 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
              {renderedSkill ? formatToolName(renderedSkill.name) : ''}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              {renderedSkill?.integrationName}
            </DialogDescription>
          </div>
          <FloatingIconButton
            onClick={onClose}
            aria-label="Close tool details"
            className="h-8 w-8"
          >
            <X className="h-3.5 w-3.5" />
          </FloatingIconButton>
        </div>
        <div className="max-h-[58vh] overflow-y-auto px-6 pb-6 text-left no-scrollbar">
          <div className="space-y-2 border-t border-zinc-100 pt-5 dark:border-zinc-900/70">
            <h3 className="text-xs font-medium text-zinc-700 dark:text-zinc-300">What this tool does</h3>
            <p className="text-sm font-normal leading-6 text-zinc-600 dark:text-zinc-300">
              {renderedSkill?.description}
            </p>
          </div>
          {renderedSkill?.inputSchema && Object.keys(renderedSkill.inputSchema.properties || {}).length > 0 && (
            <div className="mt-5 space-y-2.5">
              <h3 className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Input parameters</h3>
              <div className="overflow-x-auto rounded-lg border border-zinc-200/70 bg-zinc-50/80 p-4 font-mono text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/45 dark:text-zinc-300">
                <pre className="whitespace-pre-wrap leading-relaxed font-mono">{JSON.stringify(renderedSkill.inputSchema.properties, null, 2)}</pre>
              </div>
            </div>
          )}
          <div className="mt-5 flex items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-900/70">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Tool ID</span>
            <code className="min-w-0 truncate font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
              {renderedSkill?.name}
            </code>
          </div>
        </div>
      </IntegrationDialogContent>
    </Dialog>
  );
}
