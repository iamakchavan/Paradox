"use client";

import { ChevronDown, Globe, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  IntegrationDialogContent,
  IntegrationDialogFooter,
  IntegrationDialogHeader,
  integrationDialogPanelClass,
} from './IntegrationDialogContent';
import type { useCustomConnectorForm } from './use-custom-connector-form';

type FormController = ReturnType<typeof useCustomConnectorForm>;

export function CustomConnectorDialog({
  open,
  showAdvanced,
  setShowAdvanced,
  form,
  onDismiss,
  onCloseAndReset,
}: {
  open: boolean;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  form: FormController;
  onDismiss: () => void;
  onCloseAndReset: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={nextOpen => { if (!nextOpen) onCloseAndReset(); }}>
      <IntegrationDialogContent className={integrationDialogPanelClass}>
        <IntegrationDialogHeader
          title="Custom connector"
          description="Register a custom MCP server"
          onClose={onDismiss}
          closeLabel="Close custom connector dialog"
        />
        <form onSubmit={form.handleRegisterCustom}>
          <div className="space-y-5 px-7 pb-6">
            <Field label="Connector Name" htmlFor="custom-name">
              <Input id="custom-name" value={form.customName} onChange={event => form.setCustomName(event.target.value)} placeholder="e.g. My Database Search" required className="h-11 rounded-[14px] border-zinc-200/80 bg-zinc-50 px-3.5 text-sm shadow-none placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/5 dark:border-white/[0.08] dark:bg-white/[0.035] dark:placeholder:text-zinc-600 dark:focus-visible:border-white/[0.16] dark:focus-visible:ring-white/5" />
            </Field>
            <Field label="Server Endpoint URL" htmlFor="custom-url">
              <Input id="custom-url" value={form.customUrl} onChange={event => form.handleUrlInput(event.target.value)} placeholder="https://mcp.example.com/sse" required className="h-11 rounded-[14px] border-zinc-200/80 bg-zinc-50 px-3.5 font-mono text-xs shadow-none placeholder:font-sans placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/5 dark:border-white/[0.08] dark:bg-white/[0.035] dark:placeholder:text-zinc-600 dark:focus-visible:border-white/[0.16] dark:focus-visible:ring-white/5" />
              {form.detectingAuth ? (
                <div className="flex items-center gap-1.5 mt-2 text-zinc-450 dark:text-zinc-500 text-[11px] select-none text-left">
                  <RefreshCw className="w-3 h-3 animate-spin text-cyan-600 dark:text-cyan-400" />Checking auth type...
                </div>
              ) : form.detectedAuthResult && (
                <AuthDetectionResult result={form.detectedAuthResult} onChange={() => setShowAdvanced(true)} />
              )}
            </Field>
            <div className="border-t border-zinc-200/60 pt-4 dark:border-white/[0.07]">
              <button
                type="button"
                aria-expanded={showAdvanced}
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="-mx-2 flex w-[calc(100%+1rem)] cursor-pointer select-none items-center justify-between rounded-[12px] px-2 py-1.5 text-left outline-none transition-colors hover:bg-zinc-100/60 focus-visible:ring-2 focus-visible:ring-zinc-300/70 dark:hover:bg-white/[0.035] dark:focus-visible:ring-white/[0.1]"
              >
                <span>
                  <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Advanced settings</span>
                  <span className="mt-0.5 block text-[11px] text-zinc-400 dark:text-zinc-500">Execution strategy and authentication</span>
                </span>
                <ChevronDown className={cn('h-4 w-4 text-zinc-400 transition-transform duration-[240ms] ease-[var(--motion-ease-out)] motion-reduce:transition-none', showAdvanced && 'rotate-180')} />
              </button>
              <div
                aria-hidden={!showAdvanced}
                inert={!showAdvanced}
                className={cn(
                  'grid transition-[grid-template-rows,opacity] duration-[240ms] ease-[var(--motion-ease-out)] motion-reduce:transition-none',
                  showAdvanced ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <SelectField label="Execution Strategy" placeholder="Select strategy" value={form.customMode} onValueChange={form.setCustomMode} options={[['auto', 'Auto Checks'], ['direct', 'Direct Browser'], ['proxy', 'Server Proxy']]} />
                      <SelectField label="Auth Type" placeholder="Select auth type" value={form.customAuthType} onValueChange={form.setCustomAuthType} options={[['none', 'None / Public'], ['apiKey', 'Bearer Token'], ['oauth', 'OAuth (Consent Flow)']]} />
                    </div>
                    {form.customAuthType === 'apiKey' && (
                      <Field label="Bearer Access Token">
                        <Input type="password" value={form.customAccessToken} onChange={event => form.setCustomAccessToken(event.target.value)} placeholder="Enter authentication token" className="h-11 rounded-[14px] border-zinc-200/80 bg-zinc-50 px-3.5 text-sm shadow-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/5 dark:border-white/[0.08] dark:bg-white/[0.035] dark:focus-visible:border-white/[0.16] dark:focus-visible:ring-white/5" />
                      </Field>
                    )}
                    {form.customAuthType === 'oauth' && (
                      <Field label="Scopes (space-separated)">
                        <Input value={form.customScopes} onChange={event => form.setCustomScopes(event.target.value)} placeholder="e.g. data.records:read schema.bases:read" className="h-11 rounded-[14px] border-zinc-200/80 bg-zinc-50 px-3.5 text-sm shadow-none focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/5 dark:border-white/[0.08] dark:bg-white/[0.035] dark:focus-visible:border-white/[0.16] dark:focus-visible:ring-white/5" />
                      </Field>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <IntegrationDialogFooter>
            <Button variant="ghost" type="button" onClick={onDismiss} className="h-9 rounded-full px-4 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100 cursor-pointer">Cancel</Button>
            <Button type="submit" disabled={form.detectingAuth} className="h-9 rounded-full bg-zinc-900 px-5 text-xs font-medium text-white shadow-none hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
              {form.detectingAuth ? 'Checking Server...' : 'Add Connector'}
            </Button>
          </IntegrationDialogFooter>
        </form>
      </IntegrationDialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 text-left">{label}</label>
      {children}
    </div>
  );
}

function AuthDetectionResult({ result, onChange }: { result: 'oauth' | 'apiKey' | 'none'; onChange: () => void }) {
  const config = result === 'oauth'
    ? { label: 'OAuth (auto-registration)', Icon: Lock, classes: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/40' }
    : result === 'apiKey'
      ? { label: 'Token Required', Icon: Lock, classes: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40' }
      : { label: 'No Auth / Public', Icon: Globe, classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-950/10' };
  return (
    <div className="mt-2.5 flex items-center gap-2 select-none text-left">
      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-medium', config.classes)}>
        <config.Icon className="w-2.5 h-2.5" />{config.label}
      </span>
      <button type="button" onClick={onChange} className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-355 underline cursor-pointer select-none">Change</button>
    </div>
  );
}

function SelectField<T extends string>({ label, placeholder, value, onValueChange, options }: {
  label: string;
  placeholder: string;
  value: T;
  onValueChange: (value: T) => void;
  options: Array<[T, string]>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 text-left">{label}</label>
      <Select value={value} onValueChange={nextValue => onValueChange(nextValue as T)}>
        <SelectTrigger className="h-11 rounded-[14px] border border-zinc-200/80 bg-zinc-50 px-3.5 text-xs shadow-none focus:border-zinc-400 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-white/[0.08] dark:bg-white/[0.035] dark:focus:border-white/[0.16]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="overflow-hidden rounded-[14px] border border-zinc-200 bg-white p-1 text-zinc-800 shadow-xl dark:border-white/[0.09] dark:bg-[hsl(var(--surface-raised))] dark:text-zinc-200">
          {options.map(([optionValue, optionLabel]) => <SelectItem key={optionValue} value={optionValue} className="rounded-[10px] text-xs cursor-pointer">{optionLabel}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
