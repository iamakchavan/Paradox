"use client";

import { RefreshCw, X } from 'lucide-react';
import type { MCPIntegration } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
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
  const TemplateIcon = template?.icon;
  return (
    <Dialog open={Boolean(template)} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="w-[92%] max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 text-foreground font-sans rounded-[20px] p-0 overflow-hidden shadow-2xl text-left [&>button]:hidden focus:outline-none focus-visible:outline-none animate-in fade-in-50 zoom-in-95 duration-200">
        <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4 w-full text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200/50 dark:border-zinc-800 shrink-0">
              {TemplateIcon && <TemplateIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />}
            </div>
            <div className="flex flex-col min-w-0 gap-0.5 text-left">
              <DialogTitle className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">{template?.name}</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 dark:text-zinc-500 leading-snug">MCP Connector</DialogDescription>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-355 transition-colors p-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {template && (
          <div className="px-6 pb-6 space-y-5 text-left">
            <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed font-normal pb-1">{template.desc}</p>
            <div className="space-y-2.5">
              <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 block">Server Endpoint URL</span>
              <div className="text-xs font-mono text-zinc-700 dark:text-zinc-350 break-all select-all leading-normal bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 rounded-xl border border-zinc-200/65 dark:border-zinc-800/80">{template.url}</div>
            </div>
            {connection?.scope && (
              <div className="space-y-2.5">
                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 block">Authorized Scopes</span>
                <div className="text-xs font-mono text-zinc-700 dark:text-zinc-350 break-all leading-normal bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 rounded-xl border border-zinc-200/65 dark:border-zinc-800/80">{connection.scope}</div>
              </div>
            )}
            {connection && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">All tools enabled</span>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => onSync(connection.id)}
                    className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-350 transition-colors p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                    title="Refresh tools list"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
                  </button>
                </div>
                {!connection.cachedTools?.length ? (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No tools found. Click refresh to query endpoints.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="max-h-48 overflow-y-auto pr-1 no-scrollbar pt-0.5 pb-0.5">
                      <div className="flex flex-wrap gap-1.5">
                        {(showAllTools ? connection.cachedTools : connection.cachedTools.slice(0, 6)).map(tool => (
                          <div key={tool.name} className="inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 text-[11.5px] font-mono text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-full select-none">
                            <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-550">✓</span>
                            <span>{tool.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {connection.cachedTools.length > 6 && (
                      <button type="button" onClick={() => setShowAllTools(!showAllTools)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer select-none block mt-1">
                        {showAllTools ? 'See less' : 'See more'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {connection?.status === 'connected' && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /><span>Connected</span>
              </div>
            )}
            {connection && connection.status !== 'connected' && (
              <div className="flex items-center gap-2 text-xs text-amber-500 font-medium pt-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /><span>Disconnected (Click Connect)</span>
              </div>
            )}
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal font-normal pt-2 border-t border-zinc-100 dark:border-zinc-900/60">
              Third-party connectors are not built or maintained by Paradox. Use caution when granting access to external services. Usage is subject to the <span className="underline hover:text-zinc-650 dark:hover:text-zinc-400 cursor-pointer transition-colors">Paradox Privacy Policy</span>.
            </p>
          </div>
        )}
        <div className="px-6 py-4 flex justify-end items-center gap-2 bg-zinc-50/50 dark:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-900">
          {template && connection?.status === 'connected' ? (
            <>
              <Button variant="outline" type="button" disabled={isSyncing} onClick={() => onSync(connection.id)} className="h-8 px-4 rounded-full text-xs font-medium border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-[background-color,border-color,color,transform,opacity] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] active:scale-[0.98] motion-reduce:transform-none flex items-center gap-1.5">
                <RefreshCw className={cn('w-3 h-3 text-zinc-500', isSyncing && 'animate-spin')} />Refresh Connection
              </Button>
              <Button onClick={() => { onDelete(connection.id); onClose(); }} className="h-8 px-4 rounded-full text-xs font-medium bg-red-600 hover:bg-red-750 dark:bg-red-650 dark:hover:bg-red-550 text-white cursor-pointer transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] active:scale-[0.98] motion-reduce:transform-none">Disconnect</Button>
            </>
          ) : template && connection ? (
            <>
              <Button onClick={() => { onDelete(connection.id); onClose(); }} className="h-8 px-4 rounded-full text-xs font-medium bg-red-600 hover:bg-red-750 dark:bg-red-650 dark:hover:bg-red-550 text-white cursor-pointer transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] active:scale-[0.98] motion-reduce:transform-none">Remove</Button>
              <ConnectButton onClick={() => { onConnect(template); onClose(); }} />
            </>
          ) : template ? <ConnectButton onClick={() => { onConnect(template); onClose(); }} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConnectButton({ onClick }: { onClick: () => void }) {
  return <Button onClick={onClick} className="h-8 px-5 rounded-full text-xs font-medium bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white cursor-pointer transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] active:scale-[0.98] motion-reduce:transform-none">Connect</Button>;
}
