"use client";

import { useRef } from 'react';
import { RefreshCw, Wrench } from 'lucide-react';
import type { MCPIntegration } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  IntegrationDialogContent,
  IntegrationDialogFooter,
  IntegrationDialogHeader,
  integrationDialogPanelClass,
} from './IntegrationDialogContent';
import { ProviderLogo } from './ProviderLogo';
import type { ProviderTemplate } from './provider-catalog';

export function TemplateConnectorDialog({
  template,
  connection,
  isSyncing,
  showAllTools,
  setShowAllTools,
  onClose,
  onSync,
  onConnect,
  onDelete,
}: {
  template: ProviderTemplate | null;
  connection?: MCPIntegration;
  isSyncing: boolean;
  showAllTools: boolean;
  setShowAllTools: (show: boolean) => void;
  onClose: () => void;
  onSync: (id: string) => void;
  onConnect: (template: ProviderTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const retainedTemplate = useRef(template);
  const retainedConnection = useRef(connection);

  if (template) {
    retainedTemplate.current = template;
    retainedConnection.current = connection;
  }

  const renderedTemplate = template ?? retainedTemplate.current;
  const renderedConnection = template ? connection : retainedConnection.current;
  const TemplateIcon = renderedTemplate?.icon;
  return (
    <Dialog open={Boolean(template)} onOpenChange={open => { if (!open) onClose(); }}>
      <IntegrationDialogContent className={integrationDialogPanelClass}>
        <IntegrationDialogHeader
          title={renderedTemplate?.name}
          description="MCP connector"
          leading={TemplateIcon ? <ProviderLogo icon={TemplateIcon} variant="dialog" /> : undefined}
          onClose={onClose}
          closeLabel="Close connector dialog"
        />
        {renderedTemplate && (
          <div className="max-h-[calc(85vh-9rem)] space-y-5 overflow-y-auto px-7 pb-6 text-left no-scrollbar">
            <p className="max-w-[440px] text-sm font-normal leading-6 text-zinc-600 dark:text-zinc-300">
              {renderedTemplate.desc}
            </p>
            {(renderedConnection?.cachedTools?.length || renderedConnection?.status === 'connected') && (
              <div className="flex flex-wrap items-center gap-2">
                {Boolean(renderedConnection.cachedTools?.length) && (
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 text-[11px] font-medium text-zinc-600 dark:bg-white/[0.055] dark:text-zinc-400">
                    <Wrench className="h-3 w-3" />
                    {renderedConnection.cachedTools?.length} tools
                  </span>
                )}
                {renderedConnection.status === 'connected' && (
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/[0.1] dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                )}
              </div>
            )}
            <div className="space-y-2">
              <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-500">Server endpoint URL</span>
              <div className="select-all break-all rounded-[14px] border border-zinc-200/80 bg-zinc-50 px-3.5 py-3 font-mono text-xs leading-normal text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-300">{renderedTemplate.url}</div>
            </div>
            {renderedConnection?.scope && (
              <div className="space-y-2">
                <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-500">Authorized scopes</span>
                <div className="break-all rounded-[14px] border border-zinc-200/80 bg-zinc-50 px-3.5 py-3 font-mono text-xs leading-relaxed text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-300">{renderedConnection.scope}</div>
              </div>
            )}
            {renderedConnection && (
              <div className="space-y-3 border-t border-zinc-200/60 pt-4 dark:border-white/[0.07]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Available tools</span>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => onSync(renderedConnection.id)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300 cursor-pointer"
                    title="Refresh tools list"
                  >
                    <RefreshCw className={cn('h-3.5 w-3.5 shrink-0', isSyncing && 'animate-spin')} />
                  </button>
                </div>
                {!renderedConnection.cachedTools?.length ? (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">No tools found. Refresh to query the endpoint.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="max-h-48 overflow-y-auto pr-1 no-scrollbar pt-0.5 pb-0.5">
                      <div className="flex flex-wrap gap-1.5">
                        {(showAllTools ? renderedConnection.cachedTools : renderedConnection.cachedTools.slice(0, 6)).map(tool => (
                          <div key={tool.name} className="inline-flex items-center rounded-full border border-zinc-200/70 bg-zinc-50/80 px-2.5 py-1 font-mono text-[11px] text-zinc-700 select-none dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
                            <span>{tool.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {renderedConnection.cachedTools.length > 6 && (
                      <button type="button" onClick={() => setShowAllTools(!showAllTools)} className="mt-1 block text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 cursor-pointer select-none">
                        {showAllTools ? 'See less' : 'See more'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {renderedConnection && renderedConnection.status !== 'connected' && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-500">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /><span>Disconnected (Click Connect)</span>
              </div>
            )}
            <p className="border-t border-zinc-200/60 pt-4 text-[10px] font-normal leading-relaxed text-zinc-400 dark:border-white/[0.07] dark:text-zinc-600">
              Third-party connectors are not built or maintained by Paradox. Use caution when granting access to external services. Usage is subject to the <span className="underline transition-colors hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer">Paradox Privacy Policy</span>.
            </p>
          </div>
        )}
        <IntegrationDialogFooter>
          {renderedTemplate && renderedConnection?.status === 'connected' ? (
            <>
              <Button variant="ghost" type="button" disabled={isSyncing} onClick={() => onSync(renderedConnection.id)} className="flex h-9 items-center gap-2 rounded-full px-4 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.06] cursor-pointer">
                <RefreshCw className={cn('h-3 w-3 shrink-0 text-zinc-500', isSyncing && 'animate-spin')} />
                <span>Refresh Connection</span>
              </Button>
              <Button onClick={() => { onDelete(renderedConnection.id); onClose(); }} className="h-9 rounded-full bg-red-600 px-4 text-xs font-medium text-white shadow-none hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 cursor-pointer">Disconnect</Button>
            </>
          ) : renderedTemplate && renderedConnection ? (
            <>
              <Button variant="ghost" onClick={() => { onDelete(renderedConnection.id); onClose(); }} className="h-9 rounded-full px-4 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/[0.1] dark:hover:text-red-300 cursor-pointer">Remove</Button>
              <ConnectButton onClick={() => { onConnect(renderedTemplate); onClose(); }} />
            </>
          ) : renderedTemplate ? (
            <>
              <Button variant="ghost" type="button" onClick={onClose} className="h-9 rounded-full px-4 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100 cursor-pointer">
                Cancel
              </Button>
              <ConnectButton onClick={() => { onConnect(renderedTemplate); onClose(); }} />
            </>
          ) : null}
        </IntegrationDialogFooter>
      </IntegrationDialogContent>
    </Dialog>
  );
}

function ConnectButton({ onClick }: { onClick: () => void }) {
  return <Button onClick={onClick} className="h-9 rounded-full bg-zinc-900 px-5 text-xs font-medium text-white shadow-none hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer">Connect</Button>;
}
