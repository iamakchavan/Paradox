"use client";

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { ModelBrandNavigation } from './ModelBrandNavigation';
import { ModelDetailsPane } from './ModelDetailsPane';
import { ModelListPane } from './ModelListPane';
import type { ModelSelectorController } from './use-model-selector-controller';
import type { ModelProviderKeys, ModelSelectorAlign } from './types';

export function ModelSelectorDropdown({
  controller,
  align,
  selectedModelId,
  providerKeys,
  onSelectModel,
}: {
  controller: ModelSelectorController;
  align: ModelSelectorAlign;
  selectedModelId: string;
  providerKeys: ModelProviderKeys;
  onSelectModel: (modelId: string) => void;
}) {
  const selectModel = (modelId: string) => {
    onSelectModel(modelId);
    controller.closeDropdown();
  };

  return (
    <div
      className={cn(
        'fixed bg-background border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-[0_12px_38px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_38px_rgba(0,0,0,0.3)] p-0 z-50 flex flex-col overflow-hidden text-foreground backdrop-blur-md select-none max-h-[500px] model-dropdown-portal',
        controller.isOpen
          ? 'animate-in fade-in-0 zoom-in-95 duration-[var(--motion-duration-popover)] ease-[var(--motion-ease-out)]'
          : 'animate-out fade-out-0 zoom-out-95 duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)]',
        controller.isMobile
          ? 'w-[calc(100vw-32px)] h-[390px] left-4 right-4'
          : 'h-[450px]',
        align === 'top'
          ? (controller.isMobile
              ? (controller.isOpen ? 'top-20 left-4 right-4 slide-in-from-top-4' : 'top-20 left-4 right-4 slide-out-to-top-4')
              : (controller.isOpen ? 'slide-in-from-top-4' : 'slide-out-to-top-4'))
          : (controller.isMobile
              ? (controller.isOpen ? 'bottom-20 left-4 right-4 slide-in-from-bottom-4' : 'bottom-20 left-4 right-4 slide-out-to-bottom-4')
              : (controller.isOpen ? 'slide-in-from-bottom-4' : 'slide-out-to-bottom-4'))
      )}
      style={{
        '--tw-enter-translate-x': '0px',
        '--tw-exit-translate-x': '0px',
        ...(!controller.isMobile ? {
          left: controller.desktopPosition?.left,
          top: controller.desktopPosition?.top,
          width: controller.desktopPosition?.width,
          visibility: controller.desktopPosition ? 'visible' : 'hidden',
        } : {}),
      } as CSSProperties}
    >
      <div className={cn('flex flex-1 min-h-0', controller.isMobile ? 'flex-col' : 'flex-row')}>
        <ModelListPane
          isMobile={controller.isMobile}
          searchQuery={controller.searchQuery}
          setSearchQuery={controller.setSearchQuery}
          activeBrands={controller.activeBrands}
          groupedModels={controller.groupedModels}
          selectedModelId={selectedModelId}
          providerKeys={providerKeys}
          onHoverModel={controller.setHoveredModelId}
          onSelectModel={selectModel}
        />
        {!controller.isMobile && (
          <ModelDetailsPane
            model={controller.hoveredModel}
            copied={controller.copied}
            onCopy={controller.copyModelId}
          />
        )}
      </div>
      <ModelBrandNavigation
        selectedBrand={controller.selectedBrand}
        setSelectedBrand={controller.setSelectedBrand}
        groupedModels={controller.groupedModels}
        searchQuery={controller.searchQuery}
      />
    </div>
  );
}
