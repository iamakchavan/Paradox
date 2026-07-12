"use client";

import { createPortal } from 'react-dom';
import { ModelSelectorDropdown } from './model-selector/ModelSelectorDropdown';
import { ModelSelectorTrigger } from './model-selector/ModelSelectorTrigger';
import { useModelSelectorController } from './model-selector/use-model-selector-controller';
import type { ModelProviderKeys, ModelSelectorProps } from './model-selector/types';

export const ModelSelector = ({
  selectedModelId,
  onSelectModel,
  isLoading,
  geminiApiKey,
  mistralApiKey,
  perplexityApiKey,
  zenmuxApiKey,
  nvidiaApiKey,
  inceptionApiKey,
  minimal = false,
  align = 'bottom',
}: ModelSelectorProps) => {
  const controller = useModelSelectorController({ selectedModelId, align });
  const providerKeys: ModelProviderKeys = {
    geminiApiKey,
    mistralApiKey,
    perplexityApiKey,
    zenmuxApiKey,
    nvidiaApiKey,
    inceptionApiKey,
  };
  const dropdown = (
    <ModelSelectorDropdown
      controller={controller}
      align={align}
      selectedModelId={selectedModelId}
      providerKeys={providerKeys}
      onSelectModel={onSelectModel}
    />
  );

  return (
    <div className="relative model-selector-container animate-fade-in">
      <ModelSelectorTrigger
        triggerRef={controller.triggerRef}
        activeModel={controller.activeModel}
        isOpen={controller.isOpen}
        isLoading={isLoading}
        minimal={minimal}
        onToggle={controller.toggleDropdown}
      />
      {controller.shouldRender && (
        controller.mounted
          ? createPortal(dropdown, document.body)
          : dropdown
      )}
    </div>
  );
};
