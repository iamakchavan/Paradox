import { useRef, useEffect, useState } from 'react';
import { Paperclip, ArrowUp, Globe2, Code2, Lightbulb, X, FileText, Upload, Zap, ChevronDown, Sparkles, Check, Cpu, Sparkle, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import Image from 'next/image';

const gradientAnimation = {
  '@keyframes gradient-x': {
    '0%, 100%': {
      'background-position': '0% 50%'
    },
    '50%': {
      'background-position': '100% 50%'
    }
  },
  '.animate-gradient-x': {
    animation: 'gradient-x 3s ease infinite',
    'background-size': '200% 200%'
  }
} as const;

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSubmit: () => void;
  onStop: () => void;
  isLoading: boolean;
  geminiApiKey: string | null;
  perplexityApiKey: string | null;
  mistralApiKey: string | null;
  inceptionApiKey: string | null;
  useWebSearch: boolean;
  setUseWebSearch: (value: boolean) => void;
  useReasoning: boolean;
  setUseReasoning: (value: boolean) => void;
  useDeveloperMode: boolean;
  setUseDeveloperMode: (value: boolean) => void;
  useFastResponse: boolean;
  setUseFastResponse: (value: boolean) => void;
  useDiffusion: boolean;
  setUseDiffusion: (value: boolean) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  theme?: string | null;
  setTheme: (theme: string) => void;
  previousTheme: string;
  setPreviousTheme: (theme: string) => void;
  setShowDeveloperModeMessage: (value: boolean) => void;
  selectedImages: string[];
  removeImage: (index: number) => void;
  selectedPDFs: { name: string; data: string }[];
  removePDF: (index: number) => void;
  error: string | null;
  isInitialView?: boolean;
  shouldFocus?: boolean;
}

export const ChatInput = ({
  message,
  setMessage,
  handleSubmit,
  onStop,
  isLoading,
  geminiApiKey,
  perplexityApiKey,
  mistralApiKey,
  inceptionApiKey,
  useWebSearch,
  setUseWebSearch,
  useReasoning,
  setUseReasoning,
  useDeveloperMode,
  setUseDeveloperMode,
  useFastResponse,
  setUseFastResponse,
  useDiffusion,
  setUseDiffusion,
  handleFileUpload,
  theme,
  setTheme,
  previousTheme,
  setPreviousTheme,
  setShowDeveloperModeMessage,
  selectedImages,
  removeImage,
  selectedPDFs,
  removePDF,
  error,
  isInitialView = false,
  shouldFocus = false
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, isInitialView ? 300 : 200);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    if ((shouldFocus || isInitialView) && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [shouldFocus, isInitialView]);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768 && 'ontouchstart' in window)
      );
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Create a fake event to reuse existing file upload logic
    const event = {
      target: {
        files
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleFileUpload(event);
  };

  const getActiveModeDetails = () => {
    if (useDeveloperMode) return { label: 'Developer', icon: Code2, color: 'text-foreground/70' };
    if (useReasoning) return { label: 'DeepSeek R1', icon: Lightbulb, color: 'text-foreground/70' };
    if (useWebSearch) return { label: 'Web Search', icon: Globe2, color: 'text-foreground/70' };
    if (useFastResponse) return { label: 'Mistral Fast', icon: Zap, color: 'text-foreground/70' };
    if (useDiffusion) return { label: 'Mercury Coder', icon: Cpu, color: 'text-foreground/70' };
    return { label: 'Gemini 3.5', icon: Sparkle, color: 'text-foreground/70' };
  };

  const activeMode = getActiveModeDetails();
  const ActiveIcon = activeMode.icon;

  const handleModelSelect = (mode: 'default' | 'developer' | 'reasoning' | 'web' | 'fast' | 'diffusion') => {
    if (useDeveloperMode && mode !== 'developer') {
      setTheme(previousTheme);
    }

    setUseDeveloperMode(false);
    setUseReasoning(false);
    setUseWebSearch(false);
    setUseFastResponse(false);
    setUseDiffusion(false);

    if (mode === 'developer') {
      setPreviousTheme(theme || 'light');
      setTheme('dark');
      setShowDeveloperModeMessage(true);
      setUseDeveloperMode(true);
    } else if (mode === 'reasoning') {
      setUseReasoning(true);
    } else if (mode === 'web') {
      setUseWebSearch(true);
    } else if (mode === 'fast') {
      setUseFastResponse(true);
    } else if (mode === 'diffusion') {
      setUseDiffusion(true);
    }

    setShowModelDropdown(false);
  };

  return (
    <div className="w-full">
      {error && (
        <div className={cn(
          "mb-2 sm:mb-4 p-2 sm:p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm",
          !isInitialView && "backdrop-blur-sm"
        )}>
          {error}
        </div>
      )}

      <div 
        className={cn(
          "w-full rounded-2xl border border-border/70 bg-background/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] overflow-visible group transition-all duration-300 relative",
          "hover:border-primary/20 dark:hover:border-primary/20",
          "focus-within:border-primary/30 dark:focus-within:border-primary/30",
          "focus-within:ring-2 focus-within:ring-primary/20 dark:focus-within:ring-primary/20",
          isDragging && "ring-[3px] ring-primary/30 border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.2)]"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-gradient-x pointer-events-none" />
            <div className="absolute inset-0 bg-primary/[0.02] backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40 rounded-full animate-pulse" style={{ padding: '24px' }} />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 rounded-full animate-ping" style={{ padding: '24px', animationDuration: '2s' }} />
                  <div className="relative bg-background/95 dark:bg-background/95 p-4 rounded-full border-2 border-primary/20 shadow-xl shadow-primary/20">
                    <Upload className="w-7 h-7 text-primary animate-bounce" style={{ animationDuration: '2s' }} />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 bg-background/95 dark:bg-background/95 px-6 py-3 rounded-lg border shadow-lg">
                  <div className="text-base font-medium bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-transparent bg-clip-text">
                    Drop files to attach
                  </div>
                  <div className="text-muted-foreground/80 text-xs">
                    Images and PDFs supported
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedImages.length > 0 && (
          <div className="flex gap-2.5 p-4 pb-0 overflow-x-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
            {selectedImages.map((img, index) => (
              <div key={index} className="relative shrink-0 group/image">
                <img
                  src={img}
                  alt={`Selected ${index + 1}`}
                  className={cn(
                    "object-cover rounded-lg border shadow-sm transition-transform duration-200",
                    "group-hover/image:scale-[0.98] group-hover/image:opacity-[0.98]",
                    isInitialView ? "w-16 h-16 sm:w-18 sm:h-18" : "w-14 h-14 sm:w-16 sm:h-16"
                  )}
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-1.5 -right-1.5 bg-background/95 rounded-full p-1 shadow-md border opacity-0 scale-75 group-hover/image:opacity-100 group-hover/image:scale-100 transition-all duration-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedPDFs.length > 0 && (
          <div className="flex gap-2.5 p-4 pb-0 overflow-x-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
            {selectedPDFs.map((pdf, index) => (
              <div key={index} className="relative shrink-0 group/pdf">
                <div className="flex items-center gap-3 bg-secondary/20 rounded-lg px-4 py-3 border border-border/50 transition-colors duration-200 group-hover/pdf:bg-secondary/30">
                  <div className="w-9 h-9 flex items-center justify-center bg-primary/5 rounded-md">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate max-w-[160px]">{pdf.name}</span>
                    <span className="text-xs text-muted-foreground">PDF Document</span>
                  </div>
                  <button
                    onClick={() => removePDF(index)}
                    className="ml-2 p-1.5 hover:bg-secondary/50 rounded-full transition-all duration-200 opacity-0 scale-75 group-hover/pdf:opacity-100 group-hover/pdf:scale-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={(e) => {
              // On mobile: Enter always creates new line
              // On desktop: Shift+Enter creates new line, Enter sends message
              if (e.key === 'Enter') {
                if (isMobile || e.shiftKey) {
                  return; // Let the default behavior create a new line
                } else {
                  e.preventDefault();
                  if (!isLoading) {
                    handleSubmit();
                  }
                }
              }
            }}
            onPaste={(e: React.ClipboardEvent<HTMLTextAreaElement>) => {
              const items = e.clipboardData?.items;
              if (!items) return;

              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') !== -1) {
                  e.preventDefault();
                  const file = item.getAsFile();
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (readerEvent: ProgressEvent<FileReader>) => {
                      const dataUrl = readerEvent.target?.result as string;
                      if (dataUrl) {
                        const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                        handleFileUpload(event);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }
              }
            }}
            placeholder="Ask anything..."
            className={cn(
              "w-full placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 resize-none border-0 bg-transparent",
              "selection:bg-primary/20 selection:text-foreground",
              "transition-all duration-200 ease-out",
              "scrollbar-none overflow-y-auto",
              "hover:overflow-y-auto active:overflow-y-auto focus:overflow-y-auto",
              "[&::-webkit-scrollbar]{display:none}",
              "hover:[&::-webkit-scrollbar]{display:block;width:1px}",
              "hover:[&::-webkit-scrollbar-thumb]{background-color:rgb(var(--muted-foreground) / 0.08)}",
              isInitialView 
                ? "min-h-[100px] sm:min-h-[110px] p-5 sm:p-6 text-sm sm:text-base leading-[1.6]"
                : "min-h-[45px] sm:min-h-[50px] p-3 sm:p-4 text-xs sm:text-sm leading-[1.6]"
            )}
            disabled={!geminiApiKey && !perplexityApiKey && !mistralApiKey && !inceptionApiKey}
          />

          <div className={cn(
            "flex items-center justify-between gap-2 border-t border-border/30",
            "bg-muted/10 dark:bg-muted/[0.03] backdrop-blur-sm",
            "px-3 py-2 sm:px-4 sm:py-2.5",
            isInitialView ? "rounded-b-2xl" : "rounded-b-2xl"
          )}>
            <div className="flex items-center gap-1.5 relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept={useFastResponse ? "image/*" : "image/*,application/pdf"}
                multiple
              />
              
              {/* Attachment Button */}
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-secondary/80"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <Paperclip className="w-4 h-4 text-foreground/70" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" sideOffset={5} className="z-[60]">
                    <p>Attach files</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Model Selector Dropdown Button */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="h-8 sm:h-9 rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-border/80 hover:bg-secondary/45 text-xs font-medium bg-background transition-all duration-200"
                  disabled={isLoading}
                >
                  <ActiveIcon className={cn("w-3.5 h-3.5", activeMode.color)} />
                  <span>{activeMode.label}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground/80 transition-transform duration-200" style={{ transform: showModelDropdown ? 'rotate(180deg)' : 'none' }} />
                </Button>

                {/* Dropdown Backdrop to close on click outside */}
                {showModelDropdown && (
                  <div 
                    className="fixed inset-0 z-40 bg-transparent cursor-default" 
                    onClick={() => setShowModelDropdown(false)} 
                  />
                )}

                {/* Dropdown Menu */}
                {showModelDropdown && (
                  <div className="absolute bottom-11 left-0 w-64 bg-background/95 dark:bg-background/95 border border-border/60 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)] p-1.5 z-50 flex flex-col gap-0.5 origin-bottom-left animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md">
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground/60 tracking-wider uppercase">
                      Select Model
                    </div>
                    
                    {/* Gemini 3.5 */}
                    <button
                      type="button"
                      disabled={!geminiApiKey}
                      onClick={() => handleModelSelect('default')}
                      className={cn(
                        "group w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors",
                        activeMode.label === 'Gemini 3.5' ? "bg-secondary/70 text-foreground font-medium" : "hover:bg-secondary/30 text-muted-foreground hover:text-foreground",
                        !geminiApiKey && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Sparkle className="w-4 h-4 mt-0.5 text-muted-foreground/85 group-hover:text-foreground shrink-0 transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold">Gemini 3.5</span>
                          <span className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground/80 transition-colors truncate">Default model — Fast, smart & multimodal</span>
                        </div>
                      </div>
                      {activeMode.label === 'Gemini 3.5' && (
                        <Check className="w-3.5 h-3.5 text-foreground shrink-0 ml-2" />
                      )}
                    </button>

                    {/* Developer Mode */}
                    <button
                      type="button"
                      disabled={!geminiApiKey}
                      onClick={() => handleModelSelect('developer')}
                      className={cn(
                        "group w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors",
                        activeMode.label === 'Developer' ? "bg-secondary/70 text-foreground font-medium" : "hover:bg-secondary/30 text-muted-foreground hover:text-foreground",
                        !geminiApiKey && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Code2 className="w-4 h-4 mt-0.5 text-muted-foreground/85 group-hover:text-foreground shrink-0 transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold">Developer mode</span>
                          <span className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground/80 transition-colors truncate">Detailed specs & step-by-step coding</span>
                        </div>
                      </div>
                      {activeMode.label === 'Developer' && (
                        <Check className="w-3.5 h-3.5 text-foreground shrink-0 ml-2" />
                      )}
                    </button>

                    {/* DeepSeek R1 */}
                    <button
                      type="button"
                      disabled={!perplexityApiKey}
                      onClick={() => handleModelSelect('reasoning')}
                      className={cn(
                        "group w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors",
                        activeMode.label === 'DeepSeek R1' ? "bg-secondary/70 text-foreground font-medium" : "hover:bg-secondary/30 text-muted-foreground hover:text-foreground",
                        !perplexityApiKey && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Lightbulb className="w-4 h-4 mt-0.5 text-muted-foreground/85 group-hover:text-foreground shrink-0 transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold">DeepSeek R1 (Reason)</span>
                          <span className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground/80 transition-colors truncate">Deep reasoning & step-by-step thinking</span>
                        </div>
                      </div>
                      {activeMode.label === 'DeepSeek R1' && (
                        <Check className="w-3.5 h-3.5 text-foreground shrink-0 ml-2" />
                      )}
                    </button>

                    {/* Web Search */}
                    <button
                      type="button"
                      disabled={!perplexityApiKey}
                      onClick={() => handleModelSelect('web')}
                      className={cn(
                        "group w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors",
                        activeMode.label === 'Web Search' ? "bg-secondary/70 text-foreground font-medium" : "hover:bg-secondary/30 text-muted-foreground hover:text-foreground",
                        !perplexityApiKey && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Globe2 className="w-4 h-4 mt-0.5 text-muted-foreground/85 group-hover:text-foreground shrink-0 transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold">Web Search</span>
                          <span className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground/80 transition-colors truncate">Real-time web search grounding</span>
                        </div>
                      </div>
                      {activeMode.label === 'Web Search' && (
                        <Check className="w-3.5 h-3.5 text-foreground shrink-0 ml-2" />
                      )}
                    </button>

                    {/* Mistral Fast */}
                    <button
                      type="button"
                      disabled={!mistralApiKey}
                      onClick={() => handleModelSelect('fast')}
                      className={cn(
                        "group w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors",
                        activeMode.label === 'Mistral Fast' ? "bg-secondary/70 text-foreground font-medium" : "hover:bg-secondary/30 text-muted-foreground hover:text-foreground",
                        !mistralApiKey && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Zap className="w-4 h-4 mt-0.5 text-muted-foreground/85 group-hover:text-foreground shrink-0 transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold">Mistral Fast</span>
                          <span className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground/80 transition-colors truncate">Lightweight, instant response model</span>
                        </div>
                      </div>
                      {activeMode.label === 'Mistral Fast' && (
                        <Check className="w-3.5 h-3.5 text-foreground shrink-0 ml-2" />
                      )}
                    </button>

                    {/* Mercury Coder */}
                    <button
                      type="button"
                      disabled={!inceptionApiKey}
                      onClick={() => handleModelSelect('diffusion')}
                      className={cn(
                        "group w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors",
                        activeMode.label === 'Mercury Coder' ? "bg-secondary/70 text-foreground font-medium" : "hover:bg-secondary/30 text-muted-foreground hover:text-foreground",
                        !inceptionApiKey && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Cpu className="w-4 h-4 mt-0.5 text-muted-foreground/85 group-hover:text-foreground shrink-0 transition-colors" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold">Mercury Coder</span>
                          <span className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground/80 transition-colors truncate">Diffusion-based coding assistant</span>
                        </div>
                      </div>
                      {activeMode.label === 'Mercury Coder' && (
                        <Check className="w-3.5 h-3.5 text-foreground shrink-0 ml-2" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit or Stop Button */}
            {isLoading ? (
              <Button
                onClick={onStop}
                size="icon"
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary text-primary-foreground shrink-0 animate-fade-in flex items-center justify-center",
                  "hover:opacity-90 transition-opacity duration-200"
                )}
                title="Stop streaming"
              >
                <Square className="w-3 h-3 fill-current text-primary-foreground" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={(!geminiApiKey && !perplexityApiKey && !mistralApiKey && !inceptionApiKey) || (!message.trim() && selectedImages.length === 0 && selectedPDFs.length === 0)}
                size="icon"
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary text-primary-foreground shrink-0",
                  "hover:opacity-90 transition-opacity duration-200 flex items-center justify-center",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      {!geminiApiKey && !perplexityApiKey && isInitialView && (
        <p className="text-center text-muted-foreground mt-4">
          Please set your API keys in the settings to start chatting
        </p>
      )}
    </div>
  );
}; 