"use client";

import { Plus, Puzzle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MCPIntegration } from '@/lib/db';
import { AppToggleRow } from './MobileAttachControls';

interface MobileAttachAppsViewProps {
  activeApps: MCPIntegration[];
  selectedMcpIds: string[];
  onToggleMcpId: (id: string) => void;
  onManageConnectors: () => void;
}

export function MobileAttachAppsView({
  activeApps,
  selectedMcpIds,
  onToggleMcpId,
  onManageConnectors,
}: MobileAttachAppsViewProps) {
  return (
    <motion.div
      key="apps"
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 24, opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex flex-col overflow-hidden px-4 pb-5 pt-2"
    >
      <div className="mb-3 px-6 text-center text-[13px] font-medium leading-relaxed text-muted-foreground">
        Choose which connected apps can be used in this chat
      </div>

      <div className="max-h-[332px] overflow-y-auto rounded-[22px] bg-foreground/[0.035] p-1 dark:bg-white/[0.035] sidebar-scroll">
        {activeApps.length === 0 ? (
          <div className="flex min-h-[148px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground/[0.06] text-foreground/55 dark:bg-white/[0.06]">
              <Puzzle className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <div className="text-[15px] font-semibold text-foreground">No apps connected</div>
            <div className="mt-1 text-[12px] font-medium leading-relaxed text-muted-foreground">
              Add connectors from settings to use them here.
            </div>
          </div>
        ) : (
          activeApps.map((app) => (
            <AppToggleRow
              key={app.id}
              app={app}
              selected={selectedMcpIds.includes(app.id)}
              onToggle={() => onToggleMcpId(app.id)}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onManageConnectors}
        className="mt-4 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[22px] bg-cyan-500/[0.08] text-[14px] font-semibold text-cyan-700 transition-colors active:bg-cyan-500/[0.13] dark:text-cyan-300"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
        Manage connectors
      </button>
    </motion.div>
  );
}
