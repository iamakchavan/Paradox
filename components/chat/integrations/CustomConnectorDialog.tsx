"use client";

import { ChevronRight, Globe, Lock, RefreshCw, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
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
      <DialogContent className="w-[92%] max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 text-foreground font-sans rounded-[20px] p-0 overflow-hidden shadow-2xl text-left [&>button]:hidden focus:outline-none focus-visible:outline-none animate-in fade-in-50 zoom-in-95 duration-200">
        <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4 w-full text-left">
          <div className="flex flex-col min-w-0 gap-0.5 text-left">
            <DialogTitle className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">Custom Connector</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug">Register a custom MCP server</DialogDescription>
          </div>
          <button type="button" onClick={onDismiss} className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-355 transition-colors p-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <form onSubmit={form.handleRegisterCustom} className="space-y-0">
          <div className="px-6 pb-6 space-y-4">
            <Field label="Connector Name" htmlFor="custom-name">
              <Input id="custom-name" value={form.customName} onChange={event => form.setCustomName(event.target.value)} placeholder="e.g. My Database Search" required className="h-9 px-3 text-xs bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 dark:focus-visible:ring-cyan-500/15" />
            </Field>
            <Field label="Server Endpoint URL" htmlFor="custom-url">
              <Input id="custom-url" value={form.customUrl} onChange={event => form.handleUrlInput(event.target.value)} placeholder="https://mcp.example.com/sse" required className="h-9 px-3 text-xs bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 dark:focus-visible:ring-cyan-500/15" />
              {form.detectingAuth ? (
                <div className="flex items-center gap-1.5 mt-2 text-zinc-450 dark:text-zinc-500 text-[11px] select-none text-left">
                  <RefreshCw className="w-3 h-3 animate-spin text-cyan-600 dark:text-cyan-400" />Checking auth type...
                </div>
              ) : form.detectedAuthResult && (
                <AuthDetectionResult result={form.detectedAuthResult} onChange={() => setShowAdvanced(true)} />
              )}
            </Field>
            <div className="space-y-2.5">
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center justify-between w-full cursor-pointer select-none">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Advanced Settings</span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px]">{showAdvanced ? 'Hide' : 'Show'}</span>
                  <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', showAdvanced && 'transform rotate-90')} />
                </div>
              </button>
              <AnimatePresence initial={false}>
                {showAdvanced && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField label="Execution Strategy" placeholder="Select strategy" value={form.customMode} onValueChange={form.setCustomMode} options={[['auto', 'Auto Checks'], ['direct', 'Direct Browser'], ['proxy', 'Server Proxy']]} />
                      <SelectField label="Auth Type" placeholder="Select auth type" value={form.customAuthType} onValueChange={form.setCustomAuthType} options={[['none', 'None / Public'], ['apiKey', 'Bearer Token'], ['oauth', 'OAuth (Consent Flow)']]} />
                    </div>
                    {form.customAuthType === 'apiKey' && (
                      <Field label="Bearer Access Token">
                        <Input type="password" value={form.customAccessToken} onChange={event => form.setCustomAccessToken(event.target.value)} placeholder="Enter authentication token" className="h-9 px-3 rounded-xl text-xs bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500" />
                      </Field>
                    )}
                    {form.customAuthType === 'oauth' && (
                      <Field label="Scopes (space-separated)">
                        <Input value={form.customScopes} onChange={event => form.setCustomScopes(event.target.value)} placeholder="e.g. data.records:read schema.bases:read" className="h-9 px-3 rounded-xl text-xs bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500" />
                      </Field>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="px-6 py-4 flex justify-end items-center gap-2 bg-zinc-50/50 dark:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-900">
            <Button variant="outline" type="button" onClick={onDismiss} className="h-8 px-4 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-all active:scale-[0.98]">Cancel</Button>
            <Button type="submit" disabled={form.detectingAuth} className="h-8 px-4 rounded-full text-xs font-medium bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              {form.detectingAuth ? 'Checking Server...' : 'Add Connector'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 text-left">{label}</label>
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
    <div className="flex items-center gap-2 mt-2 select-none text-left">
      <span className={cn('border rounded-full text-[10.5px] font-semibold px-2.5 py-0.5 inline-flex items-center gap-1', config.classes)}>
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
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 text-left">{label}</label>
      <Select value={value} onValueChange={nextValue => onValueChange(nextValue as T)}>
        <SelectTrigger className="h-8.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-cyan-500 dark:focus:border-cyan-550 focus:outline-none">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
          {options.map(([optionValue, optionLabel]) => <SelectItem key={optionValue} value={optionValue} className="text-xs cursor-pointer">{optionLabel}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
