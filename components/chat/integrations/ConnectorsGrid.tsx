"use client";

import { Puzzle } from 'lucide-react';
import type { MCPIntegration } from '@/lib/db';
import { cn } from '@/lib/utils';
import { ProviderLogo } from './ProviderLogo';
import type { ProviderTemplate } from './provider-catalog';

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
      <div className="flex flex-col items-center justify-center p-9 bg-zinc-50/5 dark:bg-zinc-950/10 border border-dashed border-zinc-200/20 dark:border-zinc-850 rounded-2xl">
        <Puzzle className="w-9 h-9 text-muted-foreground/45 mb-3" strokeWidth={1.5} />
        <p className="text-xs text-muted-foreground text-center font-medium">No connectors found matching your search.</p>
      </div>
    );
  }
  const categories = ['Featured', 'Finance', 'Productivity'];
  return (
    <div className="space-y-6">
      {categories.map(category => {
        const categoryTemplates = templates.filter(template => template.category === category);
        if (categoryTemplates.length === 0) return null;
        return (
          <div key={category}>
            <h4 className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mb-3">{category}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {categoryTemplates.map(template => {
                const connection = integrations.find(item => item.id === template.id);
                const connected = category === 'Featured'
                  ? connection?.status === 'connected'
                  : Boolean(connection);
                const TemplateIcon = template.icon;
                return (
                  <div
                    key={template.id}
                    onClick={() => onOpenTemplate(template)}
                    className="group flex items-center gap-3.5 px-4 py-3.5 bg-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800/80 rounded-xl transition-[background-color,border-color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] cursor-pointer"
                  >
                    <ProviderLogo icon={TemplateIcon} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-100 leading-snug block truncate">{template.name}</span>
                      {connected ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Connected</span>
                        </div>
                      ) : (
                        <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500 line-clamp-1 leading-normal mt-0.5 block">{template.desc}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {customConnectors.length > 0 && (
        <div>
          <h4 className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mb-3">Custom Connectors</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {customConnectors.map(connection => (
              <div
                key={connection.id}
                onClick={() => onOpenTemplate(customTemplate(connection))}
                className="group flex items-center gap-3.5 px-4 py-3.5 bg-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800/80 rounded-xl transition-[background-color,border-color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] cursor-pointer"
              >
                <div className="w-9 h-9 flex items-center justify-center shrink-0">
                  <Puzzle className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-100 leading-snug block truncate">{connection.name}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn('w-1.5 h-1.5 rounded-full', connection.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500')} />
                    <span className={cn(
                      'text-[10px] font-medium',
                      connection.status === 'connected'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400',
                    )}>
                      {connection.status === 'connected' ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
