"use client";

import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_EASE_OUT } from '@/lib/motion';
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: align === 'top' ? -16 : 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: 0.95,
        y: align === 'top' ? -16 : 16,
        transition: { duration: 0.15, ease: MOTION_EASE_OUT },
      }}
      transition={{ duration: 0.18, ease: MOTION_EASE_OUT }}
      className={cn(
        'model-dropdown-portal fixed z-50 flex max-h-[500px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-background p-0 text-foreground shadow-[0_12px_38px_rgba(0,0,0,0.06)] select-none will-change-[transform,opacity] dark:border-white/[0.09] dark:bg-[hsl(var(--surface-panel))] dark:shadow-[0_16px_44px_rgba(0,0,0,0.42)]',
        controller.isMobile
          ? 'w-[calc(100vw-32px)] h-[390px] left-4 right-4'
          : 'h-[450px]',
        align === 'top'
          ? (controller.isMobile ? 'top-20 left-4 right-4' : '')
          : (controller.isMobile ? 'bottom-20 left-4 right-4' : '')
      )}
      style={{
        '--tw-enter-translate-x': '0px',
        '--tw-exit-translate-x': '0px',
        backfaceVisibility: 'hidden',
        transformOrigin: align === 'top' ? 'top center' : 'bottom center',
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
    </motion.div>
  );
}
