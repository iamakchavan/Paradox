"use client";

import { Puzzle } from 'lucide-react';
import { formatToolName } from './integration-utils';
import type { IntegrationToolView } from './use-integrations-view-model';

export function SkillsGrid({
  tools,
  onSelect,
}: {
  tools: IntegrationToolView[];
  onSelect: (tool: IntegrationToolView) => void;
}) {
  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-9 bg-zinc-50/5 dark:bg-zinc-950/10 border border-dashed border-zinc-200/20 dark:border-zinc-850 rounded-2xl">
        <Puzzle className="w-9 h-9 text-muted-foreground/45 mb-3" strokeWidth={1.5} />
        <p className="text-xs text-muted-foreground text-center font-medium">
          No active skills or tools found matching your search query.
        </p>
      </div>
    );
  }
  const grouped = tools.reduce((output, tool) => {
    (output[tool.integrationName] ||= []).push(tool);
    return output;
  }, {} as Record<string, IntegrationToolView[]>);
  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([integrationName, integrationTools]) => (
        <div key={integrationName} className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground/60 mb-1">
            {integrationName} Tools ({integrationTools.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {integrationTools.map(tool => (
              <div
                key={`${tool.integrationId}-${tool.name}`}
                onClick={() => onSelect(tool)}
                className="flex flex-col p-5 h-36 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-800 hover:shadow-xs transition-all duration-200 text-left cursor-pointer select-none"
              >
                <div className="flex items-start justify-between mb-2 gap-4">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{formatToolName(tool.name)}</span>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{tool.name}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-normal mt-1.5 line-clamp-2">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

