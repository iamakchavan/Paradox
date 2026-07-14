"use client";

import { Check, Lock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBrandLabel, ModelLogo } from './model-branding';
import { getModelSubtitle, isModelUnavailable } from './model-utils';
import type { GroupedModels, ModelProviderKeys } from './types';

export function ModelListPane({
  isMobile,
  searchQuery,
  setSearchQuery,
  activeBrands,
  groupedModels,
  selectedModelId,
  providerKeys,
  onHoverModel,
  onSelectModel,
}: {
  isMobile: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeBrands: readonly string[];
  groupedModels: GroupedModels;
  selectedModelId: string;
  providerKeys: ModelProviderKeys;
  onHoverModel: (modelId: string) => void;
  onSelectModel: (modelId: string) => void;
}) {
  return (
    <div className={cn(
      'model-selector-list-pane border-zinc-200/60 dark:border-zinc-800/80 flex flex-col bg-zinc-50/30 dark:bg-zinc-950/20 h-full',
      isMobile ? 'w-full h-full' : 'w-[290px] border-r'
    )}>
      <div className="p-2 border-b border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-sans"
            autoFocus={!isMobile}
            readOnly={isMobile}
            onFocus={event => {
              if (isMobile) {
                event.currentTarget.readOnly = false;
              }
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-3 custom-scrollbar outline-none focus:outline-none">
        {activeBrands.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-500 font-sans">No models found</div>
        ) : (
          activeBrands.map(brand => {
            const models = groupedModels[brand];
            if (!models?.length) return null;
            return (
              <div key={brand} className="space-y-0.5">
                <div className="px-2.5 py-1 flex items-center gap-1.5 text-[9px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 font-sans select-none">
                  <ModelLogo provider={brand} className="size-3 grayscale opacity-60" size={12} />
                  <span>{getBrandLabel(brand)}</span>
                </div>
                {models.map(model => {
                  const isSelected = model.id === selectedModelId;
                  const isDisabled = isModelUnavailable(model, providerKeys);
                  return (
                    <button
                      key={model.id}
                      type="button"
                      disabled={isDisabled}
                      onMouseEnter={() => !isMobile && onHoverModel(model.id)}
                      onClick={() => onSelectModel(model.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-[background-color,color,border-color] duration-[var(--motion-duration-fast)] relative border border-transparent select-none outline-none focus:outline-none',
                        isSelected
                          ? 'bg-zinc-100 text-zinc-950 font-medium dark:bg-zinc-900/80 dark:text-zinc-50'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200',
                        isDisabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ModelLogo provider={model.provider} modelId={model.id} className="size-3.5 rounded-xs shrink-0" size={14} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium truncate leading-normal text-zinc-800 dark:text-zinc-200">{model.name}</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-none mt-0.5">{getModelSubtitle(model)}</span>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0 ml-2">
                        {isDisabled ? (
                          <Lock className="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
                        ) : (
                          isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
