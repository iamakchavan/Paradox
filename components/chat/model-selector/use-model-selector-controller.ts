"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MODELS_REGISTRY } from '@/lib/models';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCustomToast } from '@/components/ui/custom-toast';
import { DISPLAY_BRANDS, getLogicalBrand } from './model-branding';
import type { GroupedModels, ModelDropdownPosition, ModelSelectorAlign } from './types';

export function useModelSelectorController({
  selectedModelId,
  align,
}: {
  selectedModelId: string;
  align: ModelSelectorAlign;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [desktopPosition, setDesktopPosition] = useState<ModelDropdownPosition | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(selectedModelId);
  const [copied, setCopied] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useCustomToast();
  const isMobile = useIsMobile();

  const openDropdown = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShouldRender(true);
    setIsOpen(true);
  };

  const closeDropdown = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setIsOpen(false);
    closeTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      closeTimeoutRef.current = null;
    }, 150);
  };

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!shouldRender || isMobile || !triggerRef.current) {
      setDesktopPosition(null);
      return;
    }

    const trigger = triggerRef.current;
    const viewport = trigger.closest<HTMLElement>('[data-chat-viewport]');
    if (!viewport) return;

    const updatePosition = () => {
      const triggerRect = trigger.getBoundingClientRect();
      const viewportRect = viewport.getBoundingClientRect();
      const viewportStyles = window.getComputedStyle(viewport);
      const contentLeft = viewportRect.left + (Number.parseFloat(viewportStyles.paddingLeft) || 0);
      const contentRight = viewportRect.right - (Number.parseFloat(viewportStyles.paddingRight) || 0);
      const margin = 16;
      const availableWidth = Math.max(0, contentRight - contentLeft - margin * 2);
      const width = Math.min(680, availableWidth);
      const desiredLeft = triggerRect.left + triggerRect.width / 2 - width / 2;
      const left = Math.min(
        Math.max(desiredLeft, contentLeft + margin),
        contentRight - margin - width
      );

      setDesktopPosition({
        left,
        top: align === 'top' ? triggerRect.bottom + 8 : triggerRect.top - 458,
        width,
      });
    };

    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(viewport);
    observer.observe(trigger);
    window.addEventListener('resize', updatePosition);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [align, isMobile, shouldRender]);

  useEffect(() => {
    if (isOpen) {
      setHoveredModelId(selectedModelId);
      setSelectedBrand(null);
    }
  }, [isOpen, selectedModelId]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.isConnected) return;
      if (isOpen && !target.closest('.model-selector-container') && !target.closest('.model-dropdown-portal')) {
        closeDropdown();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const activeModel = useMemo(
    () => MODELS_REGISTRY.find(model => model.id === selectedModelId) || MODELS_REGISTRY[0],
    [selectedModelId]
  );
  const filteredModels = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return MODELS_REGISTRY.filter(model => (
      model.name.toLowerCase().includes(query) || model.description.toLowerCase().includes(query)
    ));
  }, [searchQuery]);
  const groupedModels = useMemo(() => {
    return filteredModels.reduce<GroupedModels>((groups, model) => {
      const brand = getLogicalBrand(model.id, model.provider);
      (groups[brand] ||= []).push(model);
      return groups;
    }, {});
  }, [filteredModels]);
  const activeBrands = useMemo(() => {
    const brands: readonly string[] = selectedBrand ? [selectedBrand] : DISPLAY_BRANDS;
    return brands.filter(brand => groupedModels[brand]?.length > 0);
  }, [selectedBrand, groupedModels]);
  const hoveredModel = useMemo(
    () => MODELS_REGISTRY.find(model => model.id === (hoveredModelId || selectedModelId)) || MODELS_REGISTRY[0],
    [hoveredModelId, selectedModelId]
  );

  const copyModelId = (event: React.MouseEvent, modelId: string) => {
    event.stopPropagation();
    navigator.clipboard.writeText(modelId);
    setCopied(true);
    showToast({
      message: 'Model ID copied to clipboard',
      type: 'success',
      mode: 'capsule',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    isOpen,
    shouldRender,
    desktopPosition,
    triggerRef,
    searchQuery,
    setSearchQuery,
    hoveredModelId,
    setHoveredModelId,
    copied,
    selectedBrand,
    setSelectedBrand,
    mounted,
    isMobile,
    activeModel,
    groupedModels,
    activeBrands,
    hoveredModel,
    closeDropdown,
    toggleDropdown,
    copyModelId,
  };
}

export type ModelSelectorController = ReturnType<typeof useModelSelectorController>;
