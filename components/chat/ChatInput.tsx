import { useRef, useEffect, useState } from 'react';
import { Paperclip, ArrowUp, Globe2, Code2, Lightbulb, X, FileText, Upload, Zap } from 'lucide-react';
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
  isLoading: boolean;
  geminiApiKey: string | null;
  perplexityApiKey: string | null;
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
  isLoading,
  geminiApiKey,
  perplexityApiKey,
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
          "w-full rounded-md border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden group transition-all duration-300 relative",
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
                  handleSubmit();
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
            disabled={(!geminiApiKey && !perplexityApiKey) || isLoading}
          />

          <div className={cn(
            "flex items-center justify-between gap-1.5 sm:gap-2 border-t border-border/40",
            "bg-gradient-to-b from-muted/30 to-muted/10",
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
            "px-2 py-1.5 sm:px-4 sm:py-2.5",
            isInitialView ? "px-5 py-2.5 sm:px-6 sm:py-3" : "px-2.5 py-1.5 sm:px-4 sm:py-2"
          )}>
            <div className="flex items-center gap-0.5 sm:gap-2 overflow-x-auto scrollbar-none">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept={useFastResponse ? "image/*" : "image/*,application/pdf"}
                multiple
              />
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "transition-all duration-200 h-8 w-8 sm:h-9 sm:w-9",
                        "hover:bg-secondary/80"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" sideOffset={5} className="z-[60]">
                    <p>Attach files</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={useDeveloperMode ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "transition-all duration-200 overflow-hidden shrink-0",
                        "h-8 w-8 sm:h-9 sm:w-9",
                        useDeveloperMode && "w-[120px] sm:w-[140px] bg-cyan-600 text-white hover:bg-cyan-700",
                        !useDeveloperMode && "w-8 sm:w-9 hover:bg-primary/10",
                      )}
                      disabled={!geminiApiKey || isLoading || useWebSearch || useReasoning}
                      onClick={() => {
                        if (!useDeveloperMode) {
                          setPreviousTheme(theme || 'light');
                          setTheme('dark');
                          setShowDeveloperModeMessage(true);
                        } else {
                          setTheme(previousTheme);
                        }
                        setUseDeveloperMode(!useDeveloperMode);
                        if (useWebSearch) setUseWebSearch(false);
                        if (useReasoning) setUseReasoning(false);
                      }}
                    >
                      <div className="flex items-center">
                        <Code2 className="w-4 h-4 shrink-0" />
                        {useDeveloperMode && (
                          <span className="ml-2 whitespace-nowrap text-sm font-medium">
                            DEVELOPER
                          </span>
                        )}
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" sideOffset={5} className="z-[60]">
                    <p>Switch to developer mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={useReasoning ? "default" : "ghost"}
                      size="icon"
                      disabled={!perplexityApiKey || isLoading || useWebSearch || useDeveloperMode}
                      className={cn(
                        "transition-all duration-200 overflow-hidden shrink-0",
                        "h-8 w-8 sm:h-9 sm:w-9",
                        useReasoning && "w-[90px] sm:w-[110px] bg-cyan-600 text-white hover:bg-cyan-700",
                        !useReasoning && "w-8 sm:w-9 hover:bg-primary/10",
                      )}
                      onClick={() => {
                        setUseReasoning(!useReasoning);
                        if (useWebSearch) setUseWebSearch(false);
                      }}
                    >
                      <div className="flex items-center">
                        <Lightbulb className="w-4 h-4 shrink-0" />
                        {useReasoning && (
                          <span className="ml-2 whitespace-nowrap text-sm font-medium">
                            REASON
                          </span>
                        )}
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" sideOffset={5} className="z-[60]">
                    <p>DeepSeek R1 (US Hosted)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={useWebSearch ? "default" : "ghost"}
                      size="icon"
                      disabled={!perplexityApiKey || isLoading || useReasoning || useDeveloperMode}
                      className={cn(
                        "transition-all duration-200 overflow-hidden shrink-0",
                        "h-8 w-8 sm:h-9 sm:w-9",
                        useWebSearch && "w-[80px] sm:w-[90px] bg-cyan-600 text-white hover:bg-cyan-700",
                        !useWebSearch && "w-8 sm:w-9 hover:bg-primary/10",
                      )}
                      onClick={() => {
                        setUseWebSearch(!useWebSearch);
                        if (useReasoning) setUseReasoning(false);
                      }}
                    >
                      <div className="flex items-center">
                        <Globe2 className="w-4 h-4 shrink-0" />
                        {useWebSearch && (
                          <span className="ml-2 whitespace-nowrap text-sm font-medium">
                            WEB
                          </span>
                        )}
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" sideOffset={5} className="z-[60]">
                    <p>Search the web</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={useFastResponse ? "default" : "ghost"}
                      size="icon"
                      disabled={!perplexityApiKey || isLoading || useWebSearch || useDeveloperMode || useReasoning}
                      className={cn(
                        "transition-all duration-200 overflow-hidden shrink-0",
                        "h-8 w-8 sm:h-9 sm:w-9",
                        useFastResponse && "w-[80px] sm:w-[90px] bg-amber-500 text-white hover:bg-amber-600",
                        !useFastResponse && "w-8 sm:w-9 hover:bg-primary/10",
                      )}
                      onClick={() => {
                        setUseFastResponse(!useFastResponse);
                        if (useWebSearch) setUseWebSearch(false);
                        if (useReasoning) setUseReasoning(false);
                      }}
                    >
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 shrink-0" />
                        {useFastResponse && (
                          <span className="ml-2 whitespace-nowrap text-sm font-medium">
                            FAST
                          </span>
                        )}
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" sideOffset={5} className="z-[60]">
                    <p>Mistral small</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={useDiffusion ? "default" : "ghost"}
                      size="icon"
                      disabled={!perplexityApiKey || isLoading || useWebSearch || useDeveloperMode || useReasoning || useFastResponse}
                      className={cn(
                        "transition-all duration-200 overflow-hidden shrink-0",
                        "h-8 w-8 sm:h-9 sm:w-9",
                        useDiffusion && "w-[90px] sm:w-[110px] bg-purple-600 text-white hover:bg-purple-700",
                        !useDiffusion && "w-8 sm:w-9 hover:bg-primary/10",
                      )}
                      onClick={() => {
                        setUseDiffusion(!useDiffusion);
                        if (useWebSearch) setUseWebSearch(false);
                        if (useReasoning) setUseReasoning(false);
                        if (useFastResponse) setUseFastResponse(false);
                      }}
                    >
                      <div className="flex items-center">
                        <Image
                          src="/ui/mercury.png"
                          alt="Diffusion"
                          width={16}
                          height={16}
                          className="shrink-0"
                        />
                        {useDiffusion && (
                          <span className="ml-2 whitespace-nowrap text-sm font-medium">
                            DIFFUSION
                          </span>
                        )}
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" sideOffset={5} className="z-[60]">
                    <p>Mercury Coder</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={(!geminiApiKey && !perplexityApiKey) || isLoading || (!message.trim() && selectedImages.length === 0 && selectedPDFs.length === 0)}
              size="icon"
              className={cn(
                "bg-primary h-8 w-8 sm:h-9 sm:w-9 shrink-0",
                "hover:bg-primary/90 transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title="Send message"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
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