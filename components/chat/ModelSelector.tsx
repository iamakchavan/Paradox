"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronDown, 
  Check, 
  Search, 
  Lock,
  Sparkle,
  Zap,
  Globe2,
  Cpu,
  Copy
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MODELS_REGISTRY } from '@/lib/models';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCustomToast } from '@/components/ui/custom-toast';

const getProviderLogoUrl = (provider: string, modelId: string | undefined, isDark: boolean) => {
  const p = provider.toLowerCase();
  const m = modelId?.toLowerCase() || '';

  // Specific model-based overrides first
  if (m.includes('gemini')) return '/logo/gemini-color.svg';
  if (m.includes('gemma')) return '/logo/gemma-color.svg';
  if (m.includes('deepseek')) return '/logo/deepseek-color.svg';
  if (m.includes('kimi')) {
    return isDark ? '/logo/kimi-color (dark).svg' : '/logo/kimi-color.svg';
  }
  if (m.includes('zhipu')) {
    return '/logo/zhipu-color.svg';
  }
  if (m.includes('glm') || m.includes('z-ai') || m.includes('zai')) {
    return isDark ? '/logo/zai (dark).svg' : '/logo/zai.svg';
  }
  if (m.includes('moonshot')) {
    return isDark ? '/logo/moonshot (dark).svg' : '/logo/moonshot.svg';
  }
  if (m.includes('minimax')) return '/logo/minimax-color.svg';
  if (m.includes('grok') || (m.includes('xai') && !m.includes('minimax'))) {
    return isDark ? '/logo/xai (dark).svg' : '/logo/xai.svg';
  }
  if (m.includes('openai') || m.includes('gpt')) {
    return isDark ? '/logo/openai (dark).svg' : '/logo/openai.svg';
  }
  if (m.includes('stepfun') || m.includes('step')) return '/logo/stepfun-color.svg';
  if (m.includes('qwen')) return '/logo/qwen-color.svg';
  if (m.includes('alibaba')) return '/logo/alibaba-color.svg';
  if (m.includes('claude') || m.includes('anthropic')) return '/logo/claude-color.svg';
  if (m.includes('microsoft') || m.includes('phi')) return '/logo/microsoft-color.svg';
  if (m.includes('sarvam')) {
    return isDark ? '/logo/sarvam-color (dark).svg' : '/logo/sarvam-color.svg';
  }
  if (m.includes('bytedance') || m.includes('seed-oss')) {
    return '/logo/bytedance-color.svg';
  }

  // Provider fallbacks
  if (p === 'google') return '/logo/google-color.svg';
  if (p === 'google-deepmind') return '/logo/deepmind-color.svg';
  if (p === 'mistral') return '/logo/mistral-color.svg';
  if (p === 'perplexity') return '/logo/perplexity-color.svg';
  if (p === 'nvidia') return '/logo/nvidia-color.svg';
  if (p === 'zenmux') {
    return isDark ? '/logo/zenmux (dark).svg' : '/logo/zenmux.svg';
  }
  
  // Other potential fallbacks from assets
  if (p === 'openai') {
    return isDark ? '/logo/openai (dark).svg' : '/logo/openai.svg';
  }
  if (p === 'cohere') return '/logo/cohere-color.svg';
  if (p === 'groq') return '/logo/groq.svg';
  if (p === 'copilot') return '/logo/copilot-color.svg';
  if (p === 'microsoft') return '/logo/microsoft-color.svg';
  if (p === 'sarvam') {
    return isDark ? '/logo/sarvam-color (dark).svg' : '/logo/sarvam-color.svg';
  }
  if (p === 'stepfun') return '/logo/stepfun-color.svg';
  if (p === 'alibaba' || p === 'qwen') return '/logo/alibaba-color.svg';
  if (p === 'anthropic' || p === 'claude') return '/logo/claude-color.svg';
  if (p === 'zhipu') return '/logo/zhipu-color.svg';
  if (p === 'zai') return isDark ? '/logo/zai (dark).svg' : '/logo/zai.svg';
  if (p === 'minimax') return '/logo/minimax-color.svg';
  if (p === 'deepseek') return '/logo/deepseek-color.svg';
  if (p === 'kimi' || p === 'moonshot') return isDark ? '/logo/moonshot (dark).svg' : '/logo/moonshot.svg';
  if (p === 'bytedance') return '/logo/bytedance-color.svg';
  if (p === 'inception') {
    return isDark ? '/logo/inception (dark).svg' : '/logo/inception.svg';
  }

  return null;
};

const ModelLogo = ({
  provider,
  modelId,
  className,
  size = 14,
}: {
  provider: string;
  modelId?: string;
  className?: string;
  size?: number;
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const url = getProviderLogoUrl(provider, modelId, isDark);

  if (url) {
    return (
      <img
        src={url}
        alt={provider}
        width={size}
        height={size}
        className={cn("shrink-0 object-contain", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  
  return <Cpu className={cn("text-zinc-400 dark:text-zinc-500 shrink-0", className)} style={{ width: size, height: size }} />;
};

const getLogicalBrand = (modelId: string, provider: string) => {
  const m = modelId.toLowerCase();
  const p = provider.toLowerCase();

  if (m.includes('gemma')) return 'google-deepmind';
  if (m.includes('gemini') || p === 'google') return 'google';
  if (p === 'mistral' || m.includes('mistral') || m.includes('pixtral') || m.includes('codestral')) return 'mistral';
  if (p === 'perplexity') return 'perplexity';
  if (m.includes('deepseek')) return 'deepseek';
  if (m.includes('kimi') || m.includes('moonshot')) return 'moonshot';
  if (m.includes('glm') || m.includes('zhipu') || m.includes('z-ai') || m.includes('zai')) return 'zhipu';
  if (m.includes('stepfun') || m.includes('step')) return 'stepfun';
  if (m.includes('qwen') || m.includes('alibaba')) return 'alibaba';
  if (m.includes('openai') || m.includes('gpt')) return 'openai';
  if (m.includes('minimax')) return 'minimax';
  if (m.includes('microsoft') || m.includes('phi')) return 'microsoft';
  if (m.includes('sarvam')) return 'sarvam';
  if (m.includes('bytedance') || m.includes('seed-oss')) return 'bytedance';
  if (m.includes('nemotron') || p === 'nvidia') return 'nvidia';
  if (p === 'zenmux') return 'zenmux';
  if (m.includes('mercury') || p === 'inception') return 'inception';

  return provider;
};

const DISPLAY_BRANDS = [
  'google',
  'google-deepmind',
  'openai',
  'deepseek',
  'mistral',
  'perplexity',
  'moonshot',
  'zhipu',
  'alibaba',
  'stepfun',
  'minimax',
  'microsoft',
  'sarvam',
  'bytedance',
  'nvidia',
  'inception'
] as const;

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  isLoading: boolean;
  geminiApiKey: string | null;
  mistralApiKey: string | null;
  perplexityApiKey: string | null;
  zenmuxApiKey: string | null;
  nvidiaApiKey: string | null;
  inceptionApiKey: string | null;
  minimal?: boolean;
  align?: 'top' | 'bottom';
}

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
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(selectedModelId);
  const { showToast } = useCustomToast();
  const [copied, setCopied] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
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
    }, 200); // matches duration-200
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

  // Synchronize hovered model with selected model when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHoveredModelId(selectedModelId);
      setSelectedBrand(null);
    }
  }, [isOpen, selectedModelId]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.isConnected) return;
      if (isOpen && !target.closest('.model-selector-container') && !target.closest('.model-dropdown-portal')) {
        closeDropdown();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const activeModel = useMemo(() => {
    return MODELS_REGISTRY.find(m => m.id === selectedModelId) || MODELS_REGISTRY[0];
  }, [selectedModelId]);

  const filteredModels = useMemo(() => {
    return MODELS_REGISTRY.filter((model) => {
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            model.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  const groupedModels = useMemo(() => {
    const groups: { [key: string]: typeof MODELS_REGISTRY } = {};
    filteredModels.forEach(model => {
      const brand = getLogicalBrand(model.id, model.provider);
      if (!groups[brand]) {
        groups[brand] = [];
      }
      groups[brand].push(model);
    });
    return groups;
  }, [filteredModels]);

  const activeBrands = useMemo(() => {
    const brands = selectedBrand ? [selectedBrand] : DISPLAY_BRANDS;
    return brands.filter(brand => {
      const modelsInGroup = groupedModels[brand];
      return modelsInGroup && modelsInGroup.length > 0;
    });
  }, [selectedBrand, groupedModels]);

  const hoveredModel = useMemo(() => {
    return MODELS_REGISTRY.find(m => m.id === (hoveredModelId || selectedModelId)) || MODELS_REGISTRY[0];
  }, [hoveredModelId, selectedModelId]);

  const getTabLabel = (tab: string) => {
    if (tab === 'google') return 'Google';
    if (tab === 'google-deepmind') return 'Google DeepMind';
    if (tab === 'mistral') return 'Mistral';
    if (tab === 'perplexity') return 'Perplexity';
    if (tab === 'zenmux') return 'ZenMux';
    if (tab === 'nvidia') return 'NVIDIA';
    if (tab === 'openai') return 'OpenAI';
    if (tab === 'deepseek') return 'DeepSeek';
    if (tab === 'moonshot') return 'Moonshot AI';
    if (tab === 'zai' || tab === 'zhipu') return 'Zhipu';
    if (tab === 'alibaba') return 'Alibaba';
    if (tab === 'stepfun') return 'StepFun';
    if (tab === 'minimax') return 'MiniMax';
    if (tab === 'microsoft') return 'Microsoft';
    if (tab === 'sarvam') return 'Sarvam AI';
    if (tab === 'bytedance') return 'ByteDance';
    if (tab === 'inception') return 'Inception Labs';
    return tab;
  };

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast({
      message: 'Model ID copied to clipboard',
      type: 'success',
      mode: 'capsule',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getModelSubtitle = (model: typeof MODELS_REGISTRY[0]) => {
    const isFree = model.pricing.input.includes('$0.00') || model.pricing.input.toLowerCase().includes('free');
    if (isFree) {
      return `${model.contextWindow} • Free`;
    }
    const inputPrice = model.pricing.input.split(' ')[0];
    return `${model.contextWindow} • ${inputPrice} / 1M tokens`;
  };

  const dropdownContent = (
    <div 
      className={cn(
        "fixed bg-background border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-[0_12px_38px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_38px_rgba(0,0,0,0.3)] p-0 z-50 flex flex-col overflow-hidden text-foreground backdrop-blur-md select-none max-h-[500px] model-dropdown-portal",
        isOpen 
          ? "animate-in fade-in-0 zoom-in-95 duration-300 ease-out" 
          : "animate-out fade-out-0 zoom-out-95 duration-200 ease-in",
        isMobile 
          ? "w-[calc(100vw-32px)] h-[390px] left-4 right-4" 
          : "w-[680px] h-[450px]",
        align === 'top'
          ? (isMobile 
              ? (isOpen ? "top-20 left-4 right-4 slide-in-from-top-4" : "top-20 left-4 right-4 slide-out-to-top-4")
              : (isOpen ? "md:absolute md:top-11 md:left-1/2 md:-translate-x-1/2 md:bottom-auto slide-in-from-top-4" : "md:absolute md:top-11 md:left-1/2 md:-translate-x-1/2 md:bottom-auto slide-out-to-top-4"))
          : (isMobile 
              ? (isOpen ? "bottom-20 left-4 right-4 slide-in-from-bottom-4" : "bottom-20 left-4 right-4 slide-out-to-bottom-4")
              : (isOpen ? "md:absolute md:bottom-11 md:right-0 md:left-auto slide-in-from-bottom-4" : "md:absolute md:bottom-11 md:right-0 md:left-auto slide-out-to-bottom-4"))
      )}
      style={{
        '--tw-enter-translate-x': (!isMobile && align === 'top') ? '-50%' : '0px',
        '--tw-exit-translate-x': (!isMobile && align === 'top') ? '-50%' : '0px'
      } as React.CSSProperties}
    >
      
      {/* Main content row containing Left and Right Panes */}
      <div className={cn(
        "flex flex-1 min-h-0",
        isMobile ? "flex-col" : "flex-row"
      )}>
        {/* Left Pane: Search & Model List */}
        <div className={cn(
          "border-zinc-200/60 dark:border-zinc-800/80 flex flex-col bg-zinc-50/30 dark:bg-zinc-950/20 h-full",
          isMobile ? "w-full h-full" : "w-[290px] border-r"
        )}>
          {/* Search Input */}
          <div className="p-2 border-b border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-sans"
                autoFocus={!isMobile}
                readOnly={isMobile}
                onFocus={(e) => {
                  // On mobile, remove readOnly when user explicitly taps the input
                  if (isMobile) {
                    e.currentTarget.readOnly = false;
                  }
                }}
              />
            </div>
          </div>

          {/* Model List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-3 custom-scrollbar outline-none focus:outline-none">
            {activeBrands.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-500 font-sans">
                No models found
              </div>
            ) : (
              activeBrands.map((brand) => {
                const modelsInGroup = groupedModels[brand];
                if (!modelsInGroup || modelsInGroup.length === 0) return null;

                return (
                  <div key={brand} className="space-y-0.5">
                    <div className="px-2.5 py-1 flex items-center gap-1.5 text-[9px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 font-sans select-none">
                      <ModelLogo provider={brand} className="size-3 grayscale opacity-60" size={12} />
                      <span>{getTabLabel(brand)}</span>
                    </div>
                    {modelsInGroup.map((model) => {
                      const isSelected = model.id === selectedModelId;
                      const providerKey = model.provider === 'google' 
                        ? geminiApiKey 
                        : model.provider === 'mistral'
                        ? mistralApiKey
                        : model.provider === 'perplexity'
                        ? perplexityApiKey
                        : model.provider === 'nvidia'
                        ? nvidiaApiKey
                        : model.provider === 'inception'
                        ? inceptionApiKey
                        : zenmuxApiKey;
                      const isDisabled = !providerKey;

                      return (
                        <button
                          key={model.id}
                          type="button"
                          disabled={isDisabled}
                          onMouseEnter={() => !isMobile && setHoveredModelId(model.id)}
                          onClick={() => {
                            onSelectModel(model.id);
                            closeDropdown();
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all relative border border-transparent select-none outline-none focus:outline-none",
                            isSelected 
                              ? "bg-zinc-100 text-zinc-950 font-medium dark:bg-zinc-900/80 dark:text-zinc-50" 
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200",
                            isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ModelLogo provider={model.provider} modelId={model.id} className="size-3.5 rounded-xs shrink-0" size={14} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium truncate leading-normal text-zinc-800 dark:text-zinc-200">
                                {model.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-none mt-0.5">
                                {getModelSubtitle(model)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center shrink-0 ml-2">
                            {isDisabled ? (
                              <Lock className="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
                            ) : (
                              isSelected && (
                                <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50 shrink-0" />
                              )
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

        {/* Right Pane: Model Inspector (Desktop Only) */}
        {!isMobile && (
          <div className="flex-1 p-5 flex flex-col justify-between bg-zinc-50/10 dark:bg-zinc-950/5 h-full">
            {hoveredModel ? (
              <div className="flex flex-col h-full justify-between">
                {/* Top: Name & Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ModelLogo provider={hoveredModel.provider} modelId={hoveredModel.id} className="size-4.5 rounded-xs" size={18} />
                    <h4 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight leading-snug">
                      {hoveredModel.name}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                    {hoveredModel.description}
                  </p>
                </div>

                {/* Bottom: Clean Meta List */}
                <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-4 space-y-2.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500">Provider</span>
                    <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                      <ModelLogo provider={hoveredModel.provider} className="size-3.5 rounded-xs" size={14} />
                      <span>{getTabLabel(hoveredModel.provider)}</span>
                    </div>
                  </div>
                  {hoveredModel.tags.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 dark:text-zinc-500">Capabilities</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[160px]" title={hoveredModel.tags.join(', ')}>
                        {hoveredModel.tags.join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500">Context Limit</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{hoveredModel.contextWindow}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500">Cost (1M tokens)</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {hoveredModel.pricing.input.split(' ')[0]} in / {hoveredModel.pricing.output.split(' ')[0]} out
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-zinc-400 dark:text-zinc-500">Model ID</span>
                    <div className="flex items-center gap-1.5 bg-zinc-100/50 dark:bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/50">
                      <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-350 max-w-[130px] truncate">
                        {hoveredModel.id}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, hoveredModel.id)}
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
        )}
      </div>

      {/* Footer: Brand Filter Nav Bar */}
      <div className="px-3 py-2 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/40 dark:bg-zinc-950/40 flex items-center justify-start md:justify-center gap-2 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full select-none">
        {DISPLAY_BRANDS.map((brand) => {
          const isBrandSelected = selectedBrand === brand;
          const hasModels = groupedModels[brand] && groupedModels[brand].length > 0;
          
          return (
            <button
              key={brand}
              type="button"
              onClick={() => setSelectedBrand(isBrandSelected ? null : brand)}
              className={cn(
                "p-1 rounded-md border transition-all duration-200 shrink-0 hover:scale-105 flex items-center justify-center outline-none focus:outline-none",
                isBrandSelected
                  ? "bg-zinc-200/80 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 opacity-100 shadow-2xs scale-105"
                  : "bg-transparent border-transparent opacity-65 grayscale hover:opacity-100 hover:grayscale-0",
                !hasModels && searchQuery && "opacity-25 grayscale cursor-not-allowed hover:scale-100 hover:opacity-25"
              )}
              disabled={!hasModels && !!searchQuery}
              title={getTabLabel(brand)}
            >
              <ModelLogo provider={brand} className="size-4.5 rounded-sm" size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative model-selector-container animate-fade-in">
      <Button
        variant={minimal ? "ghost" : "outline"}
        onClick={toggleDropdown}
        className={cn(
          minimal 
            ? "h-8 sm:h-9 rounded-full px-2.5 flex items-center gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 text-xs font-medium bg-transparent transition-all duration-200 shadow-none border-0 shrink-0 select-none text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100"
            : "h-8 sm:h-9 rounded-full px-3.5 py-2 flex items-center gap-1.5 border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-xs font-medium bg-background/50 backdrop-blur-xs transition-all duration-200 shadow-2xs",
          isOpen && "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-50"
        )}
        disabled={isLoading}
      >
        <ModelLogo 
          provider={activeModel.provider} 
          modelId={activeModel.id} 
          className="size-3.5 sm:size-4 rounded-xs shrink-0" 
          size={16} 
        />
        <span className={cn(
          "font-sans tracking-tight truncate max-w-[85px] sm:max-w-[130px] align-middle font-medium"
        )}>
          {activeModel.name}
        </span>
        <ChevronDown 
          className="w-3 h-3 text-zinc-400 transition-transform duration-200 ease-out" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} 
        />
      </Button>

      {shouldRender && (
        isMobile && mounted
          ? createPortal(dropdownContent, document.body)
          : dropdownContent
      )}
    </div>
  );
};
