"use client";

import { Puzzle } from 'lucide-react';
import type { MCPIntegration } from '@/lib/db';
import { cn } from '@/lib/utils';
import { ProviderLogo } from './ProviderLogo';
import { PROVIDER_CATEGORIES, type ProviderTemplate } from './provider-catalog';

const connectorRowClass =
  'group flex min-h-[70px] w-full cursor-pointer items-center gap-3.5 rounded-lg px-3 py-2.5 text-left transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] hover:bg-zinc-200/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/20 dark:hover:bg-white/[0.045]';

export function ConnectorsGrid({
  integrations,
  templates,
  customConnectors,
  onOpenTemplate,
  customTemplate,
}: {
  integrations: MCPIntegration[];
  templates: ProviderTemplate[];
  customConnectors: MCPIntegration[];
  onOpenTemplate: (template: ProviderTemplate) => void;
  customTemplate: (integration: MCPIntegration) => ProviderTemplate;
}) {
  if (templates.length === 0 && customConnectors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-10 dark:border-white/[0.08] dark:bg-white/[0.015]">
        <Puzzle className="mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-600" strokeWidth={1.5} />
        <p className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
          No connectors found matching your search.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-7">
      {PROVIDER_CATEGORIES.map(category => {
        const categoryTemplates = templates.filter(template => template.category === category.id);
        if (categoryTemplates.length === 0) return null;
        return (
          <section
            key={category.id}
            aria-labelledby={`connector-category-${category.id}`}
            className="border-t border-zinc-200/70 pt-4 first:border-t-0 first:pt-0 dark:border-white/[0.07]"
          >
            <div className="mb-2 flex items-baseline gap-2 px-1">
              <h2
                id={`connector-category-${category.id}`}
                className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300"
              >
                {category.label}
              </h2>
              <span className="text-[10px] tabular-nums text-zinc-400 dark:text-zinc-600">
                {categoryTemplates.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-x-7 gap-y-0.5 md:grid-cols-2">
              {categoryTemplates.map(template => {
                const connection = integrations.find(item => item.id === template.id);
                const connected = connection?.status === 'connected';
                const TemplateIcon = template.icon;
                return (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => onOpenTemplate(template)}
                    className={connectorRowClass}
                  >
                    <ProviderLogo icon={TemplateIcon} className="h-9 w-9" />
                    <div className="flex-1 min-w-0">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className="block truncate text-[13.5px] font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                          {template.name}
                        </span>
                        {connected && (
                          <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Connected
                          </span>
                        )}
                      </div>
                      <span className="mt-1 block truncate text-[11.5px] font-normal leading-normal text-zinc-500 dark:text-zinc-500">
                        {template.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      {customConnectors.length > 0 && (
        <section aria-labelledby="custom-connectors-title">
          <div className="mb-2.5 flex items-baseline gap-2 px-1">
            <h2 id="custom-connectors-title" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Custom Connectors
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-x-7 gap-y-0.5 md:grid-cols-2">
            {customConnectors.map(connection => (
              <button
                type="button"
                key={connection.id}
                onClick={() => onOpenTemplate(customTemplate(connection))}
                className={connectorRowClass}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                  <Puzzle className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="block truncate text-[13.5px] font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                      {connection.name}
                    </span>
                    <span className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium',
                      connection.status === 'connected'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400',
                    )}>
                      <span className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        connection.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500',
                      )} />
                      {connection.status === 'connected' ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <span className="mt-1 block truncate text-[11.5px] font-normal leading-normal text-zinc-500 dark:text-zinc-500">
                    {connection.url}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
