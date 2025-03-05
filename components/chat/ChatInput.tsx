import { useRef } from 'react';
import { Paperclip, ArrowUp, Globe2, Code2, Lightbulb, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

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
  isInitialView = false
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      <div className="w-full rounded-xl border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden group focus-within:border-black/[0.12] dark:focus-within:border-white/[0.12] focus-within:ring-1 focus-within:ring-black/[0.12] dark:focus-within:ring-white/[0.12] transition-all duration-200">
        {selectedImages.length > 0 && (
          <div className="flex gap-2 p-3 sm:p-4 pb-0 overflow-x-auto">
            {selectedImages.map((img, index) => (
              <div key={index} className="relative shrink-0">
                <img
                  src={img}
                  alt={`Selected ${index + 1}`}
                  className={cn(
                    "object-cover rounded-lg border",
                    isInitialView ? "w-14 h-14 sm:w-16 sm:h-16" : "w-12 h-12 sm:w-14 sm:h-14"
                  )}
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-background rounded-full p-0.5 shadow-sm border"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedPDFs.length > 0 && (
          <div className="flex gap-2 p-3 sm:p-4 pb-0 overflow-x-auto">
            {selectedPDFs.map((pdf, index) => (
              <div key={index} className="relative shrink-0 flex items-center gap-2 bg-secondary/20 rounded-lg p-3 border border-border/50">
                <div className="w-8 h-8 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate max-w-[150px]">{pdf.name}</span>
                  <span className="text-xs text-muted-foreground">PDF Document</span>
                </div>
                <button
                  onClick={() => removePDF(index)}
                  className="ml-2 p-1 hover:bg-secondary/50 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Type your message..."
          className={cn(
            "w-full placeholder:text-muted-foreground focus:outline-none focus:ring-0 resize-none border-0 bg-transparent",
            isInitialView 
              ? "min-h-[100px] sm:min-h-[110px] max-h-[200px] p-6 sm:p-7 text-lg sm:text-xl"
              : "min-h-[45px] sm:min-h-[50px] max-h-[200px] p-2 sm:p-3 text-sm sm:text-base"
          )}
          disabled={(!geminiApiKey && !perplexityApiKey) || isLoading}
        />

        <div className="flex items-center gap-1 sm:gap-2 bg-background/80 backdrop-blur-sm px-2 py-1.5 border-t">
          <div className="flex-1 flex items-center gap-1 sm:gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf"
              multiple
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              disabled={(!geminiApiKey && !perplexityApiKey) || isLoading || useWebSearch || useReasoning || useDeveloperMode}
              title="Attach images and PDFs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={useDeveloperMode ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "transition-all duration-200 overflow-hidden h-8 w-8 sm:h-9 sm:w-9",
                      useDeveloperMode && "w-[120px] sm:w-[140px]",
                      !useDeveloperMode && "w-8 sm:w-9"
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
                      {useDeveloperMode && <span className="ml-2 whitespace-nowrap">DEVELOPER</span>}
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
                      "transition-all duration-200 h-8 w-8 sm:h-9 sm:w-9",
                      useReasoning && "w-[90px] sm:w-[110px]",
                      !useReasoning && "w-8 sm:w-9"
                    )}
                    onClick={() => {
                      setUseReasoning(!useReasoning);
                      if (useWebSearch) setUseWebSearch(false);
                    }}
                  >
                    <Lightbulb className="w-4 h-4" />
                    {useReasoning && <span className="ml-2 text-sm sm:text-base">REASON</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" sideOffset={5} className="z-[60]">
                  <p>Reason with DeepSeek R1 (US Hosted)</p>
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
                      "transition-all duration-200 h-8 w-8 sm:h-9 sm:w-9",
                      useWebSearch && "w-[80px] sm:w-[90px]",
                      !useWebSearch && "w-8 sm:w-9"
                    )}
                    onClick={() => {
                      setUseWebSearch(!useWebSearch);
                      if (useReasoning) setUseReasoning(false);
                    }}
                  >
                    <Globe2 className="w-4 h-4" />
                    {useWebSearch && <span className="ml-2 text-sm sm:text-base">WEB</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" sideOffset={5} className="z-[60]">
                  <p>Search the web</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={(!geminiApiKey && !perplexityApiKey) || isLoading || (!message.trim() && selectedImages.length === 0 && selectedPDFs.length === 0)}
            size="icon"
            className="bg-primary h-8 w-8 sm:h-9 sm:w-9"
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
      {!geminiApiKey && !perplexityApiKey && isInitialView && (
        <p className="text-center text-muted-foreground mt-4">
          Please set your API keys in the settings to start chatting
        </p>
      )}
    </div>
  );
}; 