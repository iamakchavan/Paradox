import { useRef, useEffect, useState, useMemo, useCallback, useLayoutEffect } from 'react';
import { Plus, Image, ArrowUp, X, FileText, Upload, Square, Grid, Github, Calendar, Puzzle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { MODELS_REGISTRY } from '@/lib/models';
import { motion, AnimatePresence } from 'framer-motion';

const AttachFileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
  </svg>
);

const DeepResearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12.2429 6.18353L8.55917 8.27415C7.72801 8.74586 7.31243 8.98172 7.20411 9.38603C7.09579 9.79034 7.33779 10.2024 7.82179 11.0264L8.41749 12.0407C8.88853 12.8427 9.12405 13.2437 9.51996 13.3497C9.91586 13.4558 10.3203 13.2263 11.1292 12.7672L14.8646 10.6472M7.05634 9.72257L3.4236 11.7843C2.56736 12.2702 2.13923 12.5132 2.02681 12.9256C1.91438 13.3381 2.16156 13.7589 2.65591 14.6006C3.15026 15.4423 3.39744 15.8631 3.81702 15.9736C4.2366 16.0842 4.66472 15.8412 5.52096 15.3552L9.1537 13.2935M21.3441 5.18488L20.2954 3.39939C19.8011 2.55771 19.5539 2.13687 19.1343 2.02635C18.7147 1.91584 18.2866 2.15881 17.4304 2.64476L13.7467 4.73538C12.9155 5.20709 12.4999 5.44294 12.3916 5.84725C12.2833 6.25157 12.5253 6.6636 13.0093 7.48766L14.1293 9.39465C14.6004 10.1966 14.8359 10.5976 15.2318 10.7037C15.6277 10.8098 16.0322 10.5802 16.841 10.1212L20.5764 8.00122C21.4326 7.51527 21.8608 7.2723 21.9732 6.85985C22.0856 6.44741 21.8384 6.02657 21.3441 5.18488Z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"></path>
    <path d="M12 12.5L16 22" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"></path>
    <path d="M12 12.5L8 22" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"></path>
  </svg>
);

const WebSearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" stroke="currentColor" strokeWidth={1.5}></path>
    <path d="M17.8486 6.19085C19.8605 5.81929 21.3391 5.98001 21.8291 6.76327C22.8403 8.37947 19.2594 12.0342 13.8309 14.9264C8.40242 17.8185 3.18203 18.8529 2.17085 17.2367C1.63758 16.3844 2.38148 14.9651 4 13.3897" stroke="currentColor" strokeWidth={1.5}></path>
  </svg>
);

interface ChatInputProps {
  message?: string;
  setMessage?: (message: string) => void;
  handleSubmit: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
  geminiApiKey: string | null;
  mistralApiKey: string | null;
  perplexityApiKey: string | null;
  zenmuxApiKey: string | null;
  nvidiaApiKey: string | null;
  inceptionApiKey: string | null;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImages: string[];
  removeImage: (index: number) => void;
  selectedPDFs: { name: string; data: string }[];
  removePDF: (index: number) => void;
  error: string | null;
  isInitialView?: boolean;
  shouldFocus?: boolean;
  searchEnabled?: boolean;
  onToggleSearch?: (enabled: boolean) => void;
  researchEnabled?: boolean;
  onToggleResearch?: (enabled: boolean) => void;
  onExpandedChange?: (expanded: boolean) => void;
  onOpenSettingsTab?: (tab: 'ai-providers' | 'search-scraping' | 'appearance' | 'integrations') => void;
}

const containerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 10,
    transformOrigin: 'bottom left'
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transformOrigin: 'bottom left',
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 28,
      mass: 0.8
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 8,
    transformOrigin: 'bottom left',
    transition: {
      type: "spring",
      stiffness: 450,
      damping: 32
    }
  }
};

const isMobileOrTablet = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth < 1024 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0)
  );
};

export const ChatInput = ({
  message,
  setMessage,
  handleSubmit,
  onStop,
  isLoading,
  geminiApiKey,
  mistralApiKey,
  perplexityApiKey,
  zenmuxApiKey,
  nvidiaApiKey,
  inceptionApiKey,
  selectedModelId,
  onSelectModel,
  handleFileUpload,
  selectedImages,
  removeImage,
  selectedPDFs,
  removePDF,
  error,
  isInitialView = false,
  shouldFocus = false,
  searchEnabled = false,
  onToggleSearch,
  researchEnabled = false,
  onToggleResearch,
  onExpandedChange,
  onOpenSettingsTab
}: ChatInputProps) => {
  const [localMessage, setLocalMessage] = useState(message || '');
  
  const mcpServers = useLiveQuery(() => db.mcpIntegrations.toArray()) || [];
  const activeApps = mcpServers.filter(s => s.isEnabled);

  // Synchronize external resets
  useEffect(() => {
    setLocalMessage(message || '');
  }, [message]);

  const handleLocalSubmit = () => {
    const trimmed = localMessage.trim();
    if (!trimmed && selectedImages.length === 0 && selectedPDFs.length === 0) return;
    
    // Explicitly dismiss keyboard on mobile/tablet viewports before sending
    if (isMobileOrTablet()) {
      textareaRef.current?.blur();
    }
    
    handleSubmit(localMessage);
    setLocalMessage('');
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleAttachClick = (type: 'image' | 'pdf' | 'all') => {
    if (fileInputRef.current) {
      if (type === 'image') {
        fileInputRef.current.accept = '.png,.jpg,.jpeg,.gif,.webp';
      } else if (type === 'pdf') {
        fileInputRef.current.accept = '.pdf';
      } else {
        fileInputRef.current.accept = '.png,.jpg,.jpeg,.gif,.webp,.pdf';
      }
      fileInputRef.current.click();
    }
    setShowAttachDropdown(false);
  };

  const isExpandedVisual = useMemo(() => {
    if (isMobile) {
      return (isFocused && localMessage.length > 0) || selectedImages.length > 0 || selectedPDFs.length > 0 || searchEnabled || researchEnabled;
    }
    return localMessage.length > 0 || selectedImages.length > 0 || selectedPDFs.length > 0 || searchEnabled || researchEnabled;
  }, [isMobile, isFocused, localMessage.length, selectedImages.length, selectedPDFs.length, searchEnabled, researchEnabled]);

  useEffect(() => {
    onExpandedChange?.(isExpandedVisual);
  }, [isExpandedVisual, onExpandedChange]);

  const [isCapsuleHovered, setIsCapsuleHovered] = useState(false);
  const [isResearchCapsuleHovered, setIsResearchCapsuleHovered] = useState(false);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const baseHeight = 24;
      textarea.style.height = `${baseHeight}px`;
      if (isExpandedVisual) {
        const newHeight = Math.min(textarea.scrollHeight, isInitialView ? 240 : 160);
        textarea.style.height = `${newHeight}px`;
      }
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
    
    // Ensure scroll position is at the start when collapsed to show the beginning words of the text
    const textarea = textareaRef.current;
    if (textarea) {
      if (!isExpandedVisual) {
        textarea.scrollTop = 0;
        textarea.scrollLeft = 0;
        const t1 = setTimeout(() => {
          textarea.scrollTop = 0;
          textarea.scrollLeft = 0;
        }, 50);
        const t2 = setTimeout(() => {
          textarea.scrollTop = 0;
          textarea.scrollLeft = 0;
        }, 150);
        const t3 = setTimeout(() => {
          textarea.scrollTop = 0;
          textarea.scrollLeft = 0;
        }, 350);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      }
    }
  }, [localMessage, isExpandedVisual]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showAttachDropdown && !target.closest('.attach-dropdown-container')) {
        setShowAttachDropdown(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showAttachDropdown]);

  useEffect(() => {
    // Avoid autofocus on mobile and tablet devices to prevent keyboard popups
    if (isMobileOrTablet()) return;

    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    // Avoid autofocus on mobile and tablet devices to prevent keyboard popups
    if (isMobileOrTablet()) return;

    if ((shouldFocus || isInitialView) && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [shouldFocus, isInitialView]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) {
        setIsDragging(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length === 0) return;

      const event = {
        target: {
          files
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      handleFileUpload(event);
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [handleFileUpload]);

  // Reset hover states when capsules are disabled to prevent sticky hover states
  useEffect(() => {
    if (!searchEnabled) {
      setIsCapsuleHovered(false);
    }
  }, [searchEnabled]);

  useEffect(() => {
    if (!researchEnabled) {
      setIsResearchCapsuleHovered(false);
    }
  }, [researchEnabled]);

  const isSendDisabled = useMemo(() => {
    const activeModel = MODELS_REGISTRY.find(m => m.id === selectedModelId) || MODELS_REGISTRY[0];
    const key = activeModel.provider === 'google'
      ? geminiApiKey
      : activeModel.provider === 'mistral'
        ? mistralApiKey
        : activeModel.provider === 'perplexity'
          ? perplexityApiKey
          : activeModel.provider === 'nvidia'
            ? nvidiaApiKey
            : activeModel.provider === 'inception'
              ? inceptionApiKey
              : zenmuxApiKey;
    const hasMessage = localMessage.trim() || selectedImages.length > 0 || selectedPDFs.length > 0;
    return !key || !hasMessage;
  }, [selectedModelId, geminiApiKey, mistralApiKey, perplexityApiKey, zenmuxApiKey, nvidiaApiKey, inceptionApiKey, localMessage, selectedImages, selectedPDFs]);

  const isInputDisabled = useMemo(() => {
    return !geminiApiKey && !mistralApiKey && !perplexityApiKey && !zenmuxApiKey && !nvidiaApiKey && !inceptionApiKey;
  }, [geminiApiKey, mistralApiKey, perplexityApiKey, zenmuxApiKey, nvidiaApiKey, inceptionApiKey]);

  return (
    <div className="w-full">
      {error && (
        <div className={cn(
          "mb-3 p-3 bg-destructive/10 border border-destructive rounded-xl text-destructive text-xs sm:text-sm",
          !isInitialView && "backdrop-blur-sm"
        )}>
          {error}
        </div>
      )}

      <div
        className={cn(
          "w-full flex flex-col bg-background/95 backdrop-blur-md border rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] group transition-[border-color,background-color,box-shadow] duration-300 relative",
          isDragging
            ? "border-2 border-dashed border-blue-500/50 dark:border-blue-400/50 bg-blue-500/[0.03] dark:bg-blue-500/[0.05] overflow-hidden py-5"
            : "border-border/80 overflow-visible hover:border-zinc-300 dark:hover:border-zinc-700 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:ring-4 focus-within:ring-zinc-500/[0.04] dark:focus-within:ring-zinc-400/[0.04] focus-within:shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:focus-within:shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
        )}
      >
        {isDragging ? (
          <>
            {/* The transparent shield overlay to capture all mouse/drag events without children flickering */}
            <div className="absolute inset-0 z-20 cursor-copy" />

            {/* Gemini-style minimal drag/drop visuals */}
            <div className="flex flex-col items-center justify-center gap-2.5 z-10 w-full animate-in fade-in zoom-in-95 duration-200">
              <div className="p-2.5 bg-blue-500/10 dark:bg-blue-400/10 rounded-full text-blue-600 dark:text-blue-400">
                <AttachFileIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col items-center gap-0.5 select-none">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Drop files here</span>
                <span className="text-xs text-blue-600/70 dark:text-blue-400/70">Images and PDFs supported</span>
              </div>
            </div>
          </>
        ) : (
          <>

            {/* Attachment Previews Header inside the pill layout */}
            <AnimatePresence initial={false}>
              {selectedImages.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                  className="flex gap-2.5 px-5 pt-4 pb-1.5 overflow-x-auto scrollbar-none border-b border-border/30 rounded-t-[28px] bg-secondary/5"
                >
                  {selectedImages.map((img, index) => (
                    <motion.div
                      key={`${img.substring(0, 80)}_${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="relative shrink-0 group/image"
                    >
                      <img
                        src={img}
                        alt={`Selected ${index + 1}`}
                        className="object-cover rounded-lg border shadow-sm transition-transform duration-200 group-hover/image:scale-[0.98] group-hover/image:opacity-[0.98] w-14 h-14 sm:w-16 sm:h-16"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1.5 -right-1.5 bg-background/95 rounded-full p-1 shadow-md border opacity-0 scale-75 group-hover/image:opacity-100 group-hover/image:scale-100 transition-all duration-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {selectedPDFs.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                  className="flex gap-2.5 px-5 pt-4 pb-1.5 overflow-x-auto scrollbar-none border-b border-border/30 rounded-t-[28px] bg-secondary/5"
                >
                  {selectedPDFs.map((pdf, index) => (
                    <motion.div
                      key={`${pdf.name}_${index}`}
                      initial={{ opacity: 0, scale: 0.8, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: -10 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="relative shrink-0 group/pdf"
                    >
                      <div className="flex items-center gap-3 bg-secondary/20 rounded-lg px-4 py-2.5 border border-border/50 transition-colors duration-200 group-hover/pdf:bg-secondary/30">
                        <div className="w-8 h-8 flex items-center justify-center bg-primary/5 rounded-md">
                          <FileText className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-medium truncate max-w-[140px]">{pdf.name}</span>
                          <span className="text-[10px] text-muted-foreground">PDF Document</span>
                        </div>
                        <button
                          onClick={() => removePDF(index)}
                          className="ml-2 p-1 hover:bg-secondary/50 rounded-full transition-all duration-200 opacity-0 scale-75 group-hover/pdf:opacity-100 group-hover/pdf:scale-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input container - Transitions between Single Line Bar and Expanded Box */}
            <motion.div
              className={cn(
                "w-full relative flex transition-all duration-300 ease-out",
                isExpandedVisual
                  ? "flex-col pt-2.5 pb-[46px] px-4"
                  : "flex-row items-center gap-1 pl-1.5 pr-1.5 py-1.5 min-h-[48px]"
              )}
            >

              {/* Left Actions (Plus Button & Search Capsule) */}
              <div className={cn(
                "flex items-center gap-2 shrink-0",
                isExpandedVisual ? "absolute bottom-2 left-2.5 h-9" : ""
              )}>
                {/* Attachment Button */}
                <div className="relative attach-dropdown-container flex items-center justify-center shrink-0 h-9 w-9">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.gif,.webp,.pdf"
                    multiple
                  />
                  {isMobile ? (
                    <motion.div whileTap={{ scale: 0.88 }} className="h-9 w-9 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center shrink-0 cursor-pointer"
                        onClick={() => setShowAttachDropdown(!showAttachDropdown)}
                        onMouseDown={(e) => e.preventDefault()}
                        disabled={isLoading}
                      >
                        <Plus className="w-5 h-5 text-foreground/60 transition-transform duration-200" style={{ transform: showAttachDropdown ? 'rotate(45deg)' : 'none' }} />
                      </Button>
                    </motion.div>
                  ) : (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div whileTap={{ scale: 0.88 }} className="h-9 w-9 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center shrink-0 cursor-pointer"
                              onClick={() => setShowAttachDropdown(!showAttachDropdown)}
                              onMouseDown={(e) => e.preventDefault()}
                              disabled={isLoading}
                            >
                              <Plus className="w-5 h-5 text-foreground/60 transition-transform duration-200" style={{ transform: showAttachDropdown ? 'rotate(45deg)' : 'none' }} />
                            </Button>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" sideOffset={5} className="z-[60]">
                          <p>Attach files</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <AnimatePresence>
                    {showAttachDropdown && (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute bottom-12 left-0 w-[200px] bg-popover border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] p-1.5 z-50 flex flex-col gap-0.5 select-none"
                      >
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleAttachClick('image')}
                            onMouseDown={(e) => e.preventDefault()}
                            className="group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80 hover:text-foreground transition-all duration-150 text-left cursor-pointer whitespace-nowrap"
                          >
                            <Image className="w-4 h-4 text-foreground/60 group-hover:text-foreground/80 transition-colors duration-150 shrink-0" strokeWidth={1.5} />
                            <span className="transition-colors duration-150">Upload image</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttachClick('pdf')}
                            onMouseDown={(e) => e.preventDefault()}
                            className="group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80 hover:text-foreground transition-all duration-150 text-left cursor-pointer whitespace-nowrap"
                          >
                            <FileText className="w-4 h-4 text-foreground/60 group-hover:text-foreground/80 transition-colors duration-150 shrink-0" strokeWidth={1.5} />
                            <span className="transition-colors duration-150">Upload document</span>
                          </button>
                        </div>

                        <div className="my-1 border-t border-border/40" />

                        <button
                          type="button"
                          onClick={() => {
                            onToggleSearch?.(!searchEnabled);
                            setShowAttachDropdown(false);
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                          className={cn(
                            "group w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer whitespace-nowrap",
                            searchEnabled
                              ? "bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15"
                              : "hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <WebSearchIcon className={cn("w-4 h-4 shrink-0 transition-colors duration-150", searchEnabled ? "text-blue-500" : "text-foreground/60 group-hover:text-foreground/80")} />
                            <span className="transition-colors duration-150">Web search</span>
                          </div>
                          {searchEnabled && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mr-1" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onToggleResearch?.(!researchEnabled);
                            setShowAttachDropdown(false);
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                          className={cn(
                            "group w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer whitespace-nowrap",
                            researchEnabled
                              ? "bg-purple-500/10 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/15"
                              : "hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <DeepResearchIcon className={cn("w-4 h-4 shrink-0 transition-colors duration-150", researchEnabled ? "text-purple-500" : "text-foreground/60 group-hover:text-foreground/80")} />
                            <span className="transition-colors duration-150">Deep research</span>
                          </div>
                          {researchEnabled && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0 mr-1" />
                          )}
                        </button>

                        <div className="my-1 border-t border-border/40" />

                        <button
                          type="button"
                          onClick={() => {
                            onOpenSettingsTab?.('integrations');
                            setShowAttachDropdown(false);
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                          className="group w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80 hover:text-foreground transition-all duration-150 text-left cursor-pointer whitespace-nowrap"
                        >
                          <div className="flex items-center gap-3">
                            <Grid className="w-4 h-4 text-foreground/60 group-hover:text-foreground/80 transition-colors duration-150 shrink-0" strokeWidth={1.5} />
                            <span className="transition-colors duration-150">Apps</span>
                          </div>
                          {activeApps.length > 0 && (
                            <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              {activeApps.length}
                            </span>
                          )}
                        </button>

                        {activeApps.length > 0 && (
                          <div className="flex flex-col gap-0.5 max-h-[120px] overflow-y-auto mt-0.5 no-scrollbar">
                            {activeApps.map((app) => {
                              const iconMap: Record<string, any> = { github: Github, cal: Calendar };
                              const AppIcon = iconMap[app.id] || Puzzle;
                              return (
                                <div
                                  key={app.id}
                                  className="w-full flex items-center justify-between pl-7 pr-3 py-1 text-[11px] text-muted-foreground/85 font-medium select-none"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <AppIcon className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" strokeWidth={1.5} />
                                    <span className="truncate">{app.name}</span>
                                  </div>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search Capsule when enabled */}
                {searchEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCapsuleHovered(false);
                      onToggleSearch?.(false);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setIsCapsuleHovered(true)}
                    onMouseLeave={() => setIsCapsuleHovered(false)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out select-none border shadow-[0_1px_2px_rgba(0,0,0,0.02)] shrink-0 active:scale-[0.93] active:duration-75",
                      isCapsuleHovered
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/35 dark:border-blue-500/35"
                        : "bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20 hover:bg-blue-500/10"
                    )}
                  >
                    {isCapsuleHovered ? (
                      <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <WebSearchIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <span>Search</span>
                  </button>
                )}

                {/* Deep Research Capsule when enabled */}
                {researchEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResearchCapsuleHovered(false);
                      onToggleResearch?.(false);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setIsResearchCapsuleHovered(true)}
                    onMouseLeave={() => setIsResearchCapsuleHovered(false)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out select-none border shadow-[0_1px_2px_rgba(0,0,0,0.02)] shrink-0 active:scale-[0.93] active:duration-75",
                      isResearchCapsuleHovered
                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/35 dark:border-purple-500/35"
                        : "bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/20 hover:bg-purple-500/10"
                    )}
                  >
                    {isResearchCapsuleHovered ? (
                      <X className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <DeepResearchIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    )}
                    <span>Deep Research</span>
                  </button>
                )}
              </div>

              {/* Text Area */}
              <div className={cn(
                "min-w-0 self-center",
                isExpandedVisual ? "w-full" : "flex-1"
              )}>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={localMessage}
                  onChange={(e) => {
                    setLocalMessage(e.target.value);
                    if (setMessage) {
                      setMessage(e.target.value);
                    }
                    adjustTextareaHeight();
                  }}
                  onFocus={() => {
                    setIsFocused(true);
                    // Move selection caret to the end of the text and scroll to bottom
                    const textarea = textareaRef.current;
                    if (textarea) {
                      const len = textarea.value.length;
                      setTimeout(() => {
                        textarea.setSelectionRange(len, len);
                        textarea.scrollTop = textarea.scrollHeight;
                      }, 50);
                      setTimeout(() => {
                        textarea.setSelectionRange(len, len);
                        textarea.scrollTop = textarea.scrollHeight;
                      }, 150);
                      setTimeout(() => {
                        textarea.setSelectionRange(len, len);
                        textarea.scrollTop = textarea.scrollHeight;
                      }, 350);
                    }
                  }}
                  onBlur={() => {
                    setIsFocused(false);
                    // Ensure the text scroll is centered at the start to show the starting words when minimized
                    const textarea = textareaRef.current;
                    if (textarea) {
                      setTimeout(() => {
                        textarea.scrollTop = 0;
                        textarea.scrollLeft = 0;
                      }, 50);
                      setTimeout(() => {
                        textarea.scrollTop = 0;
                        textarea.scrollLeft = 0;
                      }, 150);
                      setTimeout(() => {
                        textarea.scrollTop = 0;
                        textarea.scrollLeft = 0;
                      }, 350);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (isMobile || e.shiftKey) {
                        return;
                      } else {
                        e.preventDefault();
                        if (!isLoading && !isSendDisabled) {
                          handleLocalSubmit();
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
                  placeholder={searchEnabled ? "Search the web" : researchEnabled ? "Run deep research..." : "Ask anything..."}
                  className={cn(
                    "w-full placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 resize-none border-0 bg-transparent text-foreground",
                    "selection:bg-primary/20 selection:text-foreground",
                    "scrollbar-none block text-base",
                    isExpandedVisual 
                      ? "py-1 leading-relaxed overflow-y-auto whitespace-pre-wrap px-1" 
                      : "py-0.5 leading-5 overflow-hidden whitespace-nowrap pl-0 pr-0.5"
                  )}
                  style={{ height: isExpandedVisual ? undefined : '24px' }}
                  disabled={isInputDisabled}
                />
              </div>

              {/* Action buttons (Right) */}
              <div className={cn(
                "flex items-center shrink-0",
                isExpandedVisual
                  ? "absolute bottom-2 right-2.5 h-9 gap-1.5 sm:gap-2"
                  : "gap-1.5 sm:gap-2 self-center"
              )}>



                {/* Submit or Stop Button */}
                {isLoading ? (
                  <Button
                    onClick={onStop}
                    onMouseDown={(e) => e.preventDefault()}
                    size="icon"
                    className="h-9 w-9 rounded-full bg-foreground text-background hover:bg-foreground/95 hover:scale-105 active:scale-[0.93] active:duration-75 shrink-0 flex items-center justify-center transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out"
                    title="Stop streaming"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleLocalSubmit}
                    disabled={isSendDisabled}
                    onMouseDown={(e) => e.preventDefault()}
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-full shrink-0 flex items-center justify-center transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out",
                      isSendDisabled
                        ? "bg-zinc-200/50 dark:bg-zinc-800/40 text-muted-foreground/35 cursor-not-allowed"
                        : "bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 hover:scale-105 active:scale-[0.93] active:duration-75 shadow-sm shadow-cyan-500/10"
                    )}
                    title="Send message"
                  >
                    <ArrowUp className="w-5 h-5 stroke-[2.5px]" />
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
      {isInitialView && isInputDisabled && (
        <p className="text-center text-muted-foreground mt-4 text-xs sm:text-sm">
          Please set your API keys in the settings to start chatting
        </p>
      )}
    </div>
  );
};