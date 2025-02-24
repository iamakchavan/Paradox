"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Paperclip, ArrowUp, Globe2, PlusCircle, Settings, X, Lightbulb, Code2, ChevronDown, FileText, Download } from 'lucide-react';
import { SettingsDialog } from '@/components/settings-dialog';
import { getGeminiApi, initGemini, streamGenerateContent } from '@/lib/gemini';
import { getPerplexityApi, initPerplexity, streamPerplexityContent } from '@/lib/perplexity';
import { ThemeToggle } from '@/components/theme-toggle';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from 'next-themes';
import { Typewriter } from '@/components/typewriter';
import { initDeveloperMode, streamDeveloperContent } from '@/lib/developer-mode';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  pdfs?: { name: string; data: string }[];
}

const processThinkingContent = (content: string) => {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const thinkMatch = content.match(thinkRegex);
  if (!thinkMatch) return { thinking: null, mainContent: content };
  
  const thinking = thinkMatch[1].trim();
  const mainContent = content.replace(thinkRegex, '').trim();
  
  return { thinking, mainContent };
};

const tableToCSV = (table: HTMLTableElement) => {
  const rows = Array.from(table.querySelectorAll('tr'));
  
  const csv = rows.map(row => {
    const cells = Array.from(row.querySelectorAll('th, td'));
    return cells.map(cell => {
      let text = cell.textContent || '';
      // Escape quotes and wrap in quotes if contains comma
      if (text.includes(',') || text.includes('"')) {
        text = `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    }).join(',');
  }).join('\n');
  
  return csv;
};

interface TableWrapperProps {
  children: React.ReactNode;
  isLoading: boolean;
  messageContent: string;
  messageIndex: number;
  currentMessageIndex: number;
}

const TableWrapper = ({ children, isLoading, messageContent, messageIndex, currentMessageIndex }: TableWrapperProps) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableData, setTableData] = useState<string>('');
  
  useEffect(() => {
    // This ensures we have access to the rendered table
    if (tableRef.current) {
      const table = tableRef.current;
      // Convert table to CSV when table is mounted
      const csv = tableToCSV(table);
      setTableData(csv);
      
      // Handle number alignment
      table.querySelectorAll('td').forEach(cell => {
        if (/^\d+(\.\d+)?$/.test(cell.textContent || '')) {
          cell.setAttribute('data-type', 'number');
        }
      });
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (tableData) {
      const blob = new Blob([tableData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'table_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [tableData]);

  const DownloadButton = useMemo(() => {
    // Only show download button if:
    // 1. We have table data
    // 2. The message has content
    // 3. Either:
    //    a. This is not the current message being generated, OR
    //    b. This is the current message but it's finished loading
    if (!tableData || 
        !processThinkingContent(messageContent).mainContent || 
        (messageIndex === currentMessageIndex && isLoading)) {
      return null;
    }
    return (
      <button
        onClick={handleDownload}
        className="download-csv-button"
        title="Download as CSV"
      >
        <Download className="w-4 h-4" />
        <span>Download CSV</span>
      </button>
    );
  }, [tableData, messageContent, messageIndex, currentMessageIndex, isLoading, handleDownload]);

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table ref={tableRef}>{children}</table>
      </div>
      {DownloadButton}
    </div>
  );
};

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [perplexityApiKey, setPerplexityApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedPDFs, setSelectedPDFs] = useState<{ name: string; data: string }[]>([]);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useReasoning, setUseReasoning] = useState(false);
  const [useDeveloperMode, setUseDeveloperMode] = useState(false);
  const [showDeveloperModeMessage, setShowDeveloperModeMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInitialView, setIsInitialView] = useState(true);
  const { setTheme, theme } = useTheme();
  const [previousTheme, setPreviousTheme] = useState<string>('');
  const [expandedThinking, setExpandedThinking] = useState<number[]>([]);
  const [processingPDF, setProcessingPDF] = useState(false);

  const promptSets = [
    [
      "Explain quantum computing in simple terms",
      "Write a Python script to analyze CSV data",
      "Compare React and Vue.js frameworks"
    ],
    [
      "What are the latest developments in AI?",
      "How does blockchain technology work?",
      "Explain machine learning algorithms"
    ],
    [
      "Create a Node.js REST API structure",
      "Debug this React useEffect code",
      "Optimize SQL query performance"
    ],
    [
      "What's new in web development?",
      "Explain cloud computing architecture",
      "Design a scalable microservice"
    ]
  ];

  const [suggestedPrompts, setSuggestedPrompts] = useState(promptSets[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * promptSets.length);
    setSuggestedPrompts(promptSets[randomIndex]);
  }, []);

  useEffect(() => {
    const storedGeminiKey = localStorage.getItem('gemini-api-key');
    const storedPerplexityKey = localStorage.getItem('perplexity-api-key');
    
    if (storedGeminiKey) {
      initGemini(storedGeminiKey);
      initDeveloperMode(storedGeminiKey);
      setGeminiApiKey(storedGeminiKey);
    }
    if (storedPerplexityKey) {
      initPerplexity(storedPerplexityKey);
      setPerplexityApiKey(storedPerplexityKey);
    }
  }, []);

  useEffect(() => {
    // Only scroll in two cases:
    // 1. When a new user message is added (handled in handleSubmit)
    // 2. When the initial view changes to chat view
    if (conversation.length === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  useEffect(() => {
    if (conversation.length > 0 && isInitialView) {
      setIsInitialView(false);
    }
  }, [conversation]);

  const handleNewChat = () => {
    setConversation([]);
    setMessage('');
    setError(null);
    setIsInitialView(true);
    setSelectedImages([]);
    setSelectedPDFs([]);
    setUseWebSearch(false);
    setUseReasoning(false);
    setUseDeveloperMode(false);
    setShowDeveloperModeMessage(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type === 'application/pdf') {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit for PDFs
          setError('PDF size should be less than 10MB');
          continue;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (result) {
            setSelectedPDFs(prev => [...prev, { 
              name: file.name, 
              data: result as string 
            }]);
          }
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('image/')) {
        if (file.size > 20 * 1024 * 1024) { // 20MB limit for images
          setError('Image size should be less than 20MB');
          continue;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setSelectedImages(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removePDF = (index: number) => {
    setSelectedPDFs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if ((!message.trim() && selectedImages.length === 0 && selectedPDFs.length === 0) || (!geminiApiKey && !perplexityApiKey)) return;
    if ((useWebSearch || useReasoning) && !perplexityApiKey) {
      setError('Please set your Perplexity API key to use web search or reasoning');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Add user message and immediately scroll to it
      setConversation(prev => [...prev, { 
        role: 'user', 
        content: message,
        images: selectedImages.length > 0 ? [...selectedImages] : undefined,
        pdfs: selectedPDFs.length > 0 ? [...selectedPDFs] : undefined
      }]);
      
      // Force scroll to the new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
      
      setConversation(prev => [...prev, { role: 'assistant', content: '' }]);
      
      setMessage('');
      setSelectedImages([]);
      setSelectedPDFs([]);

      const history = conversation.slice(-6);

      let streamedText = '';
      let isThinking = false;
      if (useDeveloperMode && geminiApiKey) {
        await streamDeveloperContent(
          message,
          history,
          (token) => {
            if (token.includes('<think>')) {
              isThinking = true;
              streamedText = '';
              return;
            }
            if (token.includes('</think>')) {
              isThinking = false;
              streamedText = '';
              return;
            }
            streamedText += token;
            setConversation(prev => {
              const newConv = [...prev];
              const lastMessage = newConv[newConv.length - 1];
              if (isThinking) {
                newConv[newConv.length - 1] = {
                  ...lastMessage,
                  content: `<think>${streamedText}</think>`
                };
              } else {
                const { thinking } = processThinkingContent(lastMessage.content);
                newConv[newConv.length - 1] = {
                  ...lastMessage,
                  content: thinking ? `<think>${thinking}</think>${streamedText}` : streamedText
                };
              }
              return newConv;
            });
          }
        );
      } else if ((useWebSearch || useReasoning) && perplexityApiKey) {
        await streamPerplexityContent(
          message,
          history,
          (token) => {
            if (token.includes('<think>')) {
              isThinking = true;
              streamedText = '';
              return;
            }
            if (token.includes('</think>')) {
              isThinking = false;
              streamedText = '';
              return;
            }
            streamedText += token;
            setConversation(prev => {
              const newConv = [...prev];
              const lastMessage = newConv[newConv.length - 1];
              if (isThinking) {
                newConv[newConv.length - 1] = {
                  ...lastMessage,
                  content: `<think>${streamedText}</think>`
                };
              } else {
                const { thinking } = processThinkingContent(lastMessage.content);
                newConv[newConv.length - 1] = {
                  ...lastMessage,
                  content: thinking ? `<think>${thinking}</think>${streamedText}` : streamedText
                };
              }
              return newConv;
            });
          },
          useReasoning ? 'sonar-reasoning' : 'sonar'
        );
      } else {
        await streamGenerateContent(
          message,
          [...history, { role: 'user', content: message, images: selectedImages, pdfs: selectedPDFs }],
          (token) => {
            streamedText += token;
            setConversation(prev => {
              const newConv = [...prev];
              newConv[newConv.length - 1] = {
                role: 'assistant',
                content: streamedText
              };
              return newConv;
            });
          }
        );
      }

    } catch (error) {
      console.error('Error generating response:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate response. Please try again.');
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setIsInitialView(false);
    setTimeout(() => {
      setConversation(prev => [...prev, { 
        role: 'user', 
        content: prompt,
        images: [],
        pdfs: []
      }]);
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
      
      setConversation(prev => [...prev, { role: 'assistant', content: '' }]);
      
      handleSubmitPrompt(prompt);
    }, 0);
  };

  const handleSubmitPrompt = async (promptMessage: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const history = conversation.slice(-6);
      
      let streamedText = '';
      let isThinking = false;
      
      if (useDeveloperMode && geminiApiKey) {
        await streamDeveloperContent(
          promptMessage,
          history,
          (token) => {
            if (token.includes('<think>')) {
              isThinking = true;
              streamedText = '';
              return;
            }
            if (token.includes('</think>')) {
              isThinking = false;
              streamedText = '';
              return;
            }
            streamedText += token;
            setConversation(prev => {
              const newConv = [...prev];
              const lastMessage = newConv[newConv.length - 1];
              if (isThinking) {
                newConv[newConv.length - 1] = {
                  ...lastMessage,
                  content: `<think>${streamedText}</think>`
                };
              } else {
                const { thinking } = processThinkingContent(lastMessage.content);
                newConv[newConv.length - 1] = {
                  ...lastMessage,
                  content: thinking ? `<think>${thinking}</think>${streamedText}` : streamedText
                };
              }
              return newConv;
            });
          }
        );
      } else if ((useWebSearch || useReasoning) && perplexityApiKey) {
        await streamPerplexityContent(
          promptMessage,
          history,
          (token) => {
            if (token.includes('<think>')) {
              isThinking = true;
              streamedText = '';
              return;
            }
            if (token.includes('</think>')) {
              isThinking = false;
              streamedText = '';
              return;
            }
            streamedText += token;
            setConversation(prev => {
              const newConv = [...prev];
              const lastMessage = newConv[newConv.length - 1];
              if (isThinking) {
                newConv[newConv.length - 1] = {
                  ...lastMessage,
                  content: `<think>${streamedText}</think>`
                };
              } else {
                const { thinking } = processThinkingContent(lastMessage.content);
                newConv[newConv.length - 1] = {
                  ...lastMessage,
                  content: thinking ? `<think>${thinking}</think>${streamedText}` : streamedText
                };
              }
              return newConv;
            });
          },
          useReasoning ? 'sonar-reasoning' : 'sonar'
        );
      } else {
        await streamGenerateContent(
          promptMessage,
          [...history, { role: 'user', content: promptMessage }],
          (token) => {
            streamedText += token;
            setConversation(prev => {
              const newConv = [...prev];
              newConv[newConv.length - 1] = {
                role: 'assistant',
                content: streamedText
              };
              return newConv;
            });
          }
        );
      }
    } catch (error) {
      console.error('Error generating response:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate response. Please try again.');
      setConversation(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Image 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png"
                alt="Paradox Logo" 
                width={28} 
                height={28}
              />
              <h1 className="text-xl font-semibold hidden sm:inline">Paradox</h1>
            </div>
            <Button
              onClick={handleNewChat}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/agent">
                    <Button
                      variant="outline"
                      size="sm"
                      className="group relative overflow-hidden h-9"
                    >
                      <div className="relative z-10 flex items-center gap-2 px-2 sm:px-3 py-1">
                        <span className="text-sm font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent whitespace-nowrap">
                          <span className="hidden sm:inline">Paradox </span>Live
                        </span>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open Voice Assistant</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => document.getElementById('settings-trigger')?.click()}
            >
              <Settings className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={cn(
        "flex-1 w-full transition-all duration-500 ease-in-out",
        isInitialView ? "flex flex-col items-center justify-center -mt-16 sm:-mt-24" : "pt-16 sm:pt-20 pb-24 sm:pb-32"
      )}>
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
          {showDeveloperModeMessage ? (
            <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
              <div className="text-center space-y-6 developer-mode-transition">
                <div className="relative w-20 h-20 mx-auto mb-8">
                  <Code2 className="w-full h-full text-primary animate-pulse" />
                </div>
                <Typewriter
                  text="Entering developer mode..."
                  className="text-2xl font-bold text-primary"
                  onComplete={() => {
                    setTimeout(() => {
                      setShowDeveloperModeMessage(false);
                    }, 1000);
                  }}
                />
              </div>
            </div>
          ) : isInitialView ? (
            <div className="flex flex-col items-center gap-10 sm:gap-14 px-4 sm:px-0">
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-medium tracking-wide text-foreground" style={{ fontFamily: 'Kelly Slab' }}>
                  What do you want to search?
                </p>
              </div>

              {/* Input box for initial view */}
              <div className="w-full max-w-2xl">
                {error && (
                  <div className="mb-4 p-3 sm:p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm sm:text-base">
                    {error}
                  </div>
                )}

                <div className="relative">
                  <div className="w-full rounded-xl border bg-background shadow-lg overflow-hidden">
                    {selectedImages.length > 0 && (
                      <div className="flex gap-2 p-3 sm:p-4 pb-0 overflow-x-auto">
                        {selectedImages.map((img, index) => (
                          <div key={index} className="relative shrink-0">
                            <img
                              src={img}
                              alt={`Selected ${index + 1}`}
                              className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border"
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
                      className="w-full min-h-[100px] sm:min-h-[110px] max-h-[200px] p-6 sm:p-7 placeholder:text-muted-foreground focus:outline-none focus:ring-0 resize-none border-0 bg-transparent text-lg sm:text-xl"
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
                </div>
                {!geminiApiKey && !perplexityApiKey && (
                  <p className="text-center text-muted-foreground mt-4">
                    Please set your API keys in the settings to start chatting
                  </p>
                )}
                
                {/* Add suggested prompts */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className={cn(
                        "p-4 text-sm text-left rounded-xl bg-white dark:bg-white/5",
                        "border border-black/[0.08] dark:border-white/[0.08]",
                        "hover:border-black/[0.15] dark:hover:border-white/[0.15]",
                        "hover:bg-white dark:hover:bg-white/10",
                        "transition-all duration-200",
                        "group relative overflow-hidden shadow-sm"
                      )}
                      disabled={(!geminiApiKey && !perplexityApiKey) || isLoading}
                    >
                      <span className="line-clamp-2 text-foreground/80 group-hover:text-foreground transition-colors">
                        {prompt}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.08] to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-64 sm:pb-72">
              {conversation.map((msg: Message, index: number) => {
                const MessageTable: React.ComponentType<React.TableHTMLAttributes<HTMLTableElement>> = ({ children, ...props }) => (
                  <TableWrapper 
                    isLoading={isLoading}
                    messageContent={msg.content}
                    messageIndex={index}
                    currentMessageIndex={conversation.length - 1}
                  >
                    <table {...props}>{children}</table>
                  </TableWrapper>
                );

                return (
                  <div key={`message-${index}-${msg.role}`} className={cn(
                    "group",
                    index === conversation.length - 1 && msg.role === 'assistant' && "animate-fade-in"
                  )}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end mb-12">
                        <div className="bg-white dark:bg-white/5 border border-black/[0.08] dark:border-white/[0.08] rounded-2xl rounded-br-none px-3 sm:px-4 py-2 max-w-[90%] sm:max-w-[85%] text-sm space-y-2">
                          {msg.images && msg.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {msg.images.map((img, imgIndex) => (
                                <div key={imgIndex} className="relative w-20 h-20">
                                  <img
                                    src={img}
                                    alt={`Uploaded ${imgIndex + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          {msg.pdfs && msg.pdfs.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {msg.pdfs.map((pdf, pdfIndex) => (
                                <div key={pdfIndex} className="flex items-center gap-2 bg-secondary/20 rounded-lg p-3 border border-border/50">
                                  <div className="w-8 h-8 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate max-w-[150px]">{pdf.name}</span>
                                    <span className="text-xs text-muted-foreground">PDF Document</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pl-2 sm:pl-4 pr-8 sm:pr-12 mb-12 text-foreground">
                        {processThinkingContent(msg.content).thinking && (
                          <div className="mb-4">
                            <button
                              onClick={() => setExpandedThinking(prev => 
                                prev.includes(index) 
                                  ? prev.filter(i => i !== index)
                                  : [...prev, index]
                              )}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ChevronDown className={cn(
                                "w-4 h-4 transition-transform",
                                expandedThinking.includes(index) ? "rotate-180" : ""
                              )} />
                              {index === conversation.length - 1 && isLoading && !processThinkingContent(msg.content).mainContent ? (
                                <span className="thinking-shine">Thinking...</span>
                              ) : (
                                "Show thinking"
                              )}
                            </button>
                            {expandedThinking.includes(index) && (
                              <div className={cn(
                                "mt-2 pl-4 border-l-2 border-muted text-muted-foreground text-sm tracking-wide",
                                index === conversation.length - 1 && isLoading && "animate-thinking"
                              )} style={{ fontFamily: 'Instrument Serif', fontStyle: 'italic', letterSpacing: '0.025em' }}>
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  className="prose dark:prose-invert max-w-none prose-sm"
                                >
                                  {processThinkingContent(msg.content).thinking}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="relative group">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent"
                            components={{
                              p: ({ children }) => (
                                <p className="mb-4 last:mb-0">{children}</p>
                              ),
                              code: ({ className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || '');
                                const language = match ? match[1] : '';
                                const isInline = !match;
                                
                                if (!isInline && language) {
                                  return (
                                    <div className="rounded-lg overflow-hidden my-4 bg-[#282c34] -mx-4 sm:mx-0">
                                      <div className="px-4 py-2 bg-[#21252b] border-b border-[#1e2227]">
                                        <span className="text-xs text-muted-foreground font-mono">{language}</span>
                                      </div>
                                      <div className="overflow-x-auto">
                                        <SyntaxHighlighter
                                          style={oneDark}
                                          language={language}
                                          PreTag="div"
                                          customStyle={{
                                            margin: 0,
                                            background: 'transparent',
                                            padding: '1rem',
                                            minWidth: '100%',
                                          }}
                                          wrapLongLines={false}
                                          showLineNumbers={true}
                                        >
                                          {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                      </div>
                                    </div>
                                  );
                                }
                                return <code className={cn("bg-[#282c34] rounded px-1.5 py-0.5 font-mono text-sm", className)} {...props}>{children}</code>;
                              },
                              table: MessageTable,
                            }}
                          >
                            {processThinkingContent(msg.content).mainContent}
                          </ReactMarkdown>
                          {!isLoading && processThinkingContent(msg.content).mainContent && (
                            <button
                              onClick={() => {
                                const content = processThinkingContent(msg.content).mainContent;
                                navigator.clipboard.writeText(content).then(() => {
                                  const button = document.getElementById(`copy-button-${index}`);
                                  if (button) {
                                    button.classList.add('copied');
                                    setTimeout(() => {
                                      button.classList.remove('copied');
                                    }, 2000);
                                  }
                                });
                              }}
                              id={`copy-button-${index}`}
                              className="mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-all copy-button"
                              title="Copy to clipboard"
                            >
                              <div className="p-1.5 hover:bg-secondary rounded-md transition-colors relative">
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground copy-icon">
                                  <path d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                                </svg>
                                <svg className="w-[15px] h-[15px] absolute inset-0 m-auto text-green-500 check-icon opacity-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                              <span className="copy-text">Copy</span>
                              <span className="check-text opacity-0 absolute">Copied!</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} className="h-px" />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Only show when not in initial view */}
      {!isInitialView && (
        <div className={cn(
          "w-full transition-all duration-500 fixed",
          "max-w-2xl left-1/2 -translate-x-1/2 z-10",
          "bottom-6 sm:bottom-12 px-2 sm:px-4"
        )}>
          <div className="w-full">
            {error && (
              <div className="mb-2 sm:mb-4 p-2 sm:p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            {selectedImages.length > 0 && (
              <div className="flex gap-2 mb-2 sm:mb-4 overflow-x-auto pb-2">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative shrink-0">
                    <img
                      src={img}
                      alt={`Selected ${index + 1}`}
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 bg-background rounded-full p-0.5 shadow-sm border"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedPDFs.length > 0 && (
              <div className="flex gap-2 mb-2 sm:mb-4 overflow-x-auto pb-2">
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

            <div className="relative">
              <div className="w-full rounded-xl border bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden">
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
                  className="w-full min-h-[45px] sm:min-h-[50px] max-h-[200px] p-2 sm:p-3 placeholder:text-muted-foreground focus:outline-none focus:ring-0 resize-none border-0 bg-transparent text-sm sm:text-base"
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
            </div>
          </div>
        </div>
      )}
      
      <SettingsDialog 
        onApiKeySet={setGeminiApiKey} 
        onPerplexityApiKeySet={setPerplexityApiKey}
      />

      {processingPDF && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Processing PDF...</span>
          </div>
        </div>
      )}
    </main>
  );
}