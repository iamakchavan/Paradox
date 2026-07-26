"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, Puzzle } from 'lucide-react';
import { formatToolName } from './integration-utils';
import { IntegrationToolIcon } from './IntegrationToolIcon';
import type { IntegrationToolView } from './use-integrations-view-model';

export function SkillsGrid({
  tools,
  onSelect,
}: {
  tools: IntegrationToolView[];
  onSelect: (tool: IntegrationToolView) => void;
}) {
  const [expandedIntegrations, setExpandedIntegrations] = useState<Set<string>>(() => new Set());

  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200/20 bg-zinc-50/5 p-9 dark:border-zinc-800 dark:bg-zinc-950/10">
        <Puzzle className="mb-3 h-9 w-9 text-muted-foreground/45" strokeWidth={1.5} />
        <p className="text-center text-xs font-medium text-muted-foreground">
          No active skills or tools found matching your search query.
        </p>
      </div>
    );
  }
  const grouped = tools.reduce((output, tool) => {
    const group = output[tool.integrationId] ||= {
      integrationName: tool.integrationName,
      tools: [],
    };
    group.tools.push(tool);
    return output;
  }, {} as Record<string, { integrationName: string; tools: IntegrationToolView[] }>);

  return (
    <div className="space-y-7">
      {Object.entries(grouped).map(([integrationId, group]) => {
        const { integrationName, tools: integrationTools } = group;
        const isExpanded = expandedIntegrations.has(integrationId);
        const visibleTools = isExpanded ? integrationTools : integrationTools.slice(0, 5);
        const hiddenToolCount = integrationTools.length - 5;
        const toolsRegionId = `integration-tools-${integrationId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

        return (
          <section key={integrationId} className="space-y-2.5">
            <div className="flex items-center gap-2 px-0.5">
              <IntegrationToolIcon
                integrationId={integrationId}
                className="h-4 w-4 rounded-none bg-transparent dark:bg-transparent"
              />
              <h2 className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {integrationName}
              </h2>
              <span className="text-[11px] text-muted-foreground/55">
                {integrationTools.length} {integrationTools.length === 1 ? 'tool' : 'tools'}
              </span>
            </div>
            <div id={toolsRegionId} className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {visibleTools.map(tool => (
                <button
                  type="button"
                  key={`${tool.integrationId}-${tool.name}`}
                  onClick={() => onSelect(tool)}
                  className="flex min-h-[108px] w-full cursor-pointer select-none flex-col rounded-lg border border-zinc-200/75 bg-white/75 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/25 dark:border-zinc-900 dark:bg-zinc-950/65"
                >
                  <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatToolName(tool.name)}
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-xs font-normal leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {tool.description}
                  </span>
                  <span className="mt-auto truncate pt-2 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                    {tool.name}
                  </span>
                </button>
              ))}
            </div>
            {hiddenToolCount > 0 && (
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={toolsRegionId}
                onClick={() => {
                  setExpandedIntegrations(current => {
                    const next = new Set(current);
                    if (next.has(integrationId)) next.delete(integrationId);
                    else next.add(integrationId);
                    return next;
                  });
                }}
                className="inline-flex items-center gap-1 px-0.5 pt-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 focus-visible:outline-none focus-visible:underline dark:text-zinc-500 dark:hover:text-zinc-200 cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Show {hiddenToolCount} more
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}

