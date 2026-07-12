"use client";

import { ChevronRight, FileText, Image, Puzzle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DeepResearchIcon } from '@/components/chat/research-timeline/DeepResearchIcon';
import type { MCPIntegration } from '@/lib/db';
import { ActionTile, OptionRow } from './MobileAttachControls';
import { WebSearchIcon } from './WebSearchIcon';

interface MobileAttachMainViewProps {
  onAttachImage: () => void;
  onAttachDocument: () => void;
  searchEnabled: boolean;
  onToggleSearch?: (enabled: boolean) => void;
  researchEnabled: boolean;
  onToggleResearch?: (enabled: boolean) => void;
  activeApps: MCPIntegration[];
  selectedAppsCount: number;
  onOpenApps: () => void;
}

export function MobileAttachMainView({
  onAttachImage,
  onAttachDocument,
  searchEnabled,
  onToggleSearch,
  researchEnabled,
  onToggleResearch,
  activeApps,
  selectedAppsCount,
  onOpenApps,
}: MobileAttachMainViewProps) {
  return (
    <motion.div
      key="main"
      initial={{ x: -22, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -22, opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="h-full overflow-y-auto px-4 pb-5 pt-2 sidebar-scroll"
    >
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        <ActionTile
          icon={<Image className="h-4 w-4" strokeWidth={1.8} />}
          label="Images"
          onClick={onAttachImage}
        />
        <ActionTile
          icon={<FileText className="h-4 w-4" strokeWidth={1.8} />}
          label="Files"
          onClick={onAttachDocument}
        />
      </div>

      <div className="mt-4 divide-y divide-border/45">
        <OptionRow
          icon={<WebSearchIcon className="h-4 w-4" />}
          label="Web search"
          checked={searchEnabled}
          onClick={() => onToggleSearch?.(!searchEnabled)}
        />
        <OptionRow
          icon={<DeepResearchIcon className="h-4 w-4" />}
          label="Deep research"
          checked={researchEnabled}
          onClick={() => onToggleResearch?.(!researchEnabled)}
        />
      </div>

      <button
        type="button"
        onClick={onOpenApps}
        className="mt-2 flex min-h-[58px] w-full items-center justify-between gap-4 rounded-2xl px-2 text-left transition-colors active:bg-foreground/[0.05]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-foreground/62">
            <Puzzle className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-medium leading-tight text-foreground">Apps</span>
            <span className="mt-0.5 block truncate text-[12px] font-medium leading-tight text-muted-foreground">
              {activeApps.length > 0
                ? `${selectedAppsCount} selected from ${activeApps.length}`
                : 'Connect and manage apps'}
            </span>
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-foreground/40" strokeWidth={1.8} />
      </button>
    </motion.div>
  );
}
