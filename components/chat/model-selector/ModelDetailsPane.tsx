"use client";

import { Check, Copy } from 'lucide-react';
import type { ModelConfig } from '@/lib/models';
import { getBrandLabel, ModelLogo } from './model-branding';

export function ModelDetailsPane({
  model,
  copied,
  onCopy,
}: {
  model: ModelConfig | undefined;
  copied: boolean;
  onCopy: (event: React.MouseEvent, modelId: string) => void;
}) {
  return (
    <div className="model-selector-details-pane min-w-0 flex-1 p-5 flex flex-col justify-between bg-zinc-50/10 dark:bg-zinc-950/5 h-full">
      {model ? (
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ModelLogo provider={model.provider} modelId={model.id} className="size-4.5 rounded-xs" size={18} />
              <h4 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight leading-snug">{model.name}</h4>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">{model.description}</p>
          </div>

          <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-4 space-y-2.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 dark:text-zinc-500">Provider</span>
              <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                <ModelLogo provider={model.provider} className="size-3.5 rounded-xs" size={14} />
                <span>{getBrandLabel(model.provider)}</span>
              </div>
            </div>
            {model.tags.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 dark:text-zinc-500">Capabilities</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[160px]" title={model.tags.join(', ')}>
                  {model.tags.join(', ')}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 dark:text-zinc-500">Context Limit</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{model.contextWindow}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 dark:text-zinc-500">Cost (1M tokens)</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {model.pricing.input.split(' ')[0]} in / {model.pricing.output.split(' ')[0]} out
              </span>
            </div>
            <div className="flex justify-between items-center pt-0.5">
              <span className="text-zinc-400 dark:text-zinc-500">Model ID</span>
              <div className="flex items-center gap-1.5 bg-zinc-100/50 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">
                <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-350 max-w-[130px] truncate">{model.id}</span>
                <button
                  type="button"
                  onClick={event => onCopy(event, model.id)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all duration-150 outline-none focus:outline-none"
                  title="Copy Model ID"
                >
                  {copied ? (
                    <Check className="w-2.5 h-2.5 text-emerald-500 animate-in zoom-in-50" />
                  ) : (
                    <Copy className="w-2.5 h-2.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-xs text-zinc-400 dark:text-zinc-500 font-sans">
          Select a model to view details
        </div>
      )}
    </div>
  );
}
