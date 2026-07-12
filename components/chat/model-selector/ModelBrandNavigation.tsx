"use client";

import { cn } from '@/lib/utils';
import { DISPLAY_BRANDS, getBrandLabel, ModelLogo } from './model-branding';
import type { GroupedModels } from './types';

export function ModelBrandNavigation({
  selectedBrand,
  setSelectedBrand,
  groupedModels,
  searchQuery,
}: {
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
  groupedModels: GroupedModels;
  searchQuery: string;
}) {
  return (
    <div className="model-selector-brand-nav px-3 py-2 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/40 dark:bg-zinc-950/40 flex items-center justify-start md:justify-center gap-2 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full select-none">
      {DISPLAY_BRANDS.map(brand => {
        const isBrandSelected = selectedBrand === brand;
        const hasModels = Boolean(groupedModels[brand]?.length);
        return (
          <button
            key={brand}
            type="button"
            onClick={() => setSelectedBrand(isBrandSelected ? null : brand)}
            className={cn(
              'p-1 rounded-md border transition-all duration-200 shrink-0 hover:scale-105 flex items-center justify-center outline-none focus:outline-none',
              isBrandSelected
                ? 'bg-zinc-200/80 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 opacity-100 shadow-2xs scale-105'
                : 'bg-transparent border-transparent opacity-65 grayscale hover:opacity-100 hover:grayscale-0',
              !hasModels && searchQuery && 'opacity-25 grayscale cursor-not-allowed hover:scale-100 hover:opacity-25'
            )}
            disabled={!hasModels && Boolean(searchQuery)}
            title={getBrandLabel(brand)}
          >
            <ModelLogo provider={brand} className="size-4.5 rounded-sm" size={18} />
          </button>
        );
      })}
    </div>
  );
}
