"use client";

import { useRef } from 'react';
import { RefreshCw, X } from 'lucide-react';
import type { MCPIntegration } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { FloatingIconButton } from '@/components/ui/floating-icon-button';
import { cn } from '@/lib/utils';
import { IntegrationDialogContent } from './IntegrationDialogContent';
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
      <IntegrationDialogContent className="w-[92%] max-w-[500px] overflow-hidden rounded-[24px] border border-zinc-200/80 bg-white p-0 text-foreground shadow-2xl focus:outline-none focus-visible:outline-none dark:border-zinc-900 dark:bg-zinc-950">
        <div className="flex w-full items-start justify-between gap-4 px-6 pb-5 pt-6 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100/80 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {TemplateIcon && <TemplateIcon className="h-4.5 w-4.5" />}
            </div>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-base font-semibold leading-tight text-zinc-900 dark:text-zinc-100">{renderedTemplate?.name}</DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-snug text-zinc-500 dark:text-zinc-500">MCP connector</DialogDescription>
            </div>
          </div>
          <FloatingIconButton
            onClick={onClose}
            aria-label="Close connector dialog"
            className="h-8 w-8"
          >
            <X className="h-3.5 w-3.5" />
          </FloatingIconButton>
        </div>
        {renderedTemplate && (
          <div className="max-h-[calc(85vh-9rem)] space-y-5 overflow-y-auto px-6 pb-5 text-left no-scrollbar">
            <p className="text-sm font-normal leading-6 text-zinc-600 dark:text-zinc-300">{renderedTemplate.desc}</p>
            <div className="space-y-2">
              <span className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Server endpoint URL</span>
              <div className="select-all break-all rounded-[14px] border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 font-mono text-xs leading-normal text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/45 dark:text-zinc-300">{renderedTemplate.url}</div>
            </div>
            {renderedConnection?.scope && (
              <div className="space-y-2">
                <span className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Authorized scopes</span>
                <div className="break-all rounded-[14px] border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 font-mono text-xs leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/45 dark:text-zinc-300">{renderedConnection.scope}</div>
              </div>
            )}
            {renderedConnection && (
              <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Available tools</span>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => onSync(renderedConnection.id)}
                    className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-300 cursor-pointer"
                    title="Refresh tools list"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
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
            {renderedConnection?.status === 'connected' && (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /><span>Connected</span>
              </div>
            )}
            {renderedConnection && renderedConnection.status !== 'connected' && (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-500">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /><span>Disconnected (Click Connect)</span>
              </div>
            )}
            <p className="border-t border-zinc-100 pt-4 text-[10px] font-normal leading-relaxed text-zinc-400 dark:border-zinc-900 dark:text-zinc-500">
              Third-party connectors are not built or maintained by Paradox. Use caution when granting access to external services. Usage is subject to the <span className="underline transition-colors hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer">Paradox Privacy Policy</span>.
            </p>
          </div>
        )}
        <div className="flex items-center justify-end gap-2 px-6 pb-6">
          {renderedTemplate && renderedConnection?.status === 'connected' ? (
            <>
              <Button variant="outline" type="button" disabled={isSyncing} onClick={() => onSync(renderedConnection.id)} className="flex h-9 items-center gap-1.5 rounded-full border-zinc-200 px-4 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 cursor-pointer">
                <RefreshCw className={cn('w-3 h-3 text-zinc-500', isSyncing && 'animate-spin')} />Refresh Connection
              </Button>
              <Button onClick={() => { onDelete(renderedConnection.id); onClose(); }} className="h-9 rounded-full bg-red-600 px-4 text-xs font-medium text-white shadow-none hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 cursor-pointer">Disconnect</Button>
            </>
          ) : renderedTemplate && renderedConnection ? (
            <>
              <Button onClick={() => { onDelete(renderedConnection.id); onClose(); }} className="h-9 rounded-full bg-red-600 px-4 text-xs font-medium text-white shadow-none hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 cursor-pointer">Remove</Button>
              <ConnectButton onClick={() => { onConnect(renderedTemplate); onClose(); }} />
            </>
          ) : renderedTemplate ? <ConnectButton onClick={() => { onConnect(renderedTemplate); onClose(); }} /> : null}
        </div>
      </IntegrationDialogContent>
    </Dialog>
  );
}

function ConnectButton({ onClick }: { onClick: () => void }) {
  return <Button onClick={onClick} className="h-9 rounded-full bg-zinc-900 px-5 text-xs font-medium text-white shadow-none hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer">Connect</Button>;
}
