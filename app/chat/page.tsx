"use client";

import { useState, useEffect, useRef } from 'react';
import { Paperclip, ArrowUp, Globe2, PlusCircle, Settings, X, Lightbulb, Code2, ChevronDown } from 'lucide-react';
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

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
}

const processThinkingContent = (content: string) => {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const thinkMatch = content.match(thinkRegex);
  if (!thinkMatch) return { thinking: null, mainContent: content };
  
  const thinking = thinkMatch[1].trim();
  const mainContent = content.replace(thinkRegex, '').trim();
  
  return { thinking, mainContent };
};

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [perplexityApiKey, setPerplexityApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setUseWebSearch(false);
    setUseReasoning(false);
    setUseDeveloperMode(false);
    setShowDeveloperModeMessage(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
          setError('Image size should be less than 20MB');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setSelectedImages(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if ((!message.trim() && selectedImages.length === 0) || (!geminiApiKey && !perplexityApiKey)) return;
    if ((useWebSearch || useReasoning) && !perplexityApiKey) {
      setError('Please set your Perplexity API key to use web search or reasoning');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      setConversation(prev => [...prev, { 
        role: 'user', 
        content: message,
        images: selectedImages.length > 0 ? [...selectedImages] : undefined
      }]);
      
      setConversation(prev => [...prev, { role: 'assistant', content: '' }]);
      
      setMessage('');
      setSelectedImages([]);

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
          [...history, { role: 'user', content: message, images: selectedImages }],
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
              <h1 className="text-xl font-semibold">Paradox</h1>
            </div>
            <Button
              onClick={handleNewChat}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              New Chat
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
        isInitialView ? "flex items-center justify-center" : "pt-20"
      )}>
        <div className="w-full max-w-4xl mx-auto px-4">
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
            <div className="space-y-8 p-4">
              <div className="text-center space-y-6">
                <Image 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png"
                  alt="Paradox Logo" 
                  width={80} 
                  height={80}
                  className="mx-auto"
                />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Welcome to Paradox
                </h1>
                <p className="text-xl text-muted-foreground">
                  How can I help you today?
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-36 relative">
              {conversation.map((msg, index) => (
                <div key={index} className={cn(
                  "group",
                  index === conversation.length - 1 && msg.role === 'assistant' && "animate-fade-in"
                )}>
                  {msg.role === 'user' ? (
                    <div className="flex justify-end mb-6">
                      <div className="bg-primary/10 rounded-2xl px-4 py-2 max-w-[85%] text-sm space-y-2">
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
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="pl-4 pr-12 mb-12 text-foreground">
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
                            Show thinking
                          </button>
                          {expandedThinking.includes(index) && (
                            <div className={cn(
                              "mt-2 pl-4 border-l-2 border-muted text-muted-foreground text-sm",
                              index === conversation.length - 1 && "animate-thinking"
                            )}>
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
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent"
                        components={{
                          p: ({ children }) => (
                            <p className="mb-4 last:mb-0">
                              {children}
                            </p>
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
                        }}
                      >
                        {processThinkingContent(msg.content).mainContent}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} className="h-px" />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t">
        <div className="max-w-4xl mx-auto p-4">
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
              {error}
            </div>
          )}

          {selectedImages.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt={`Selected ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-lg"
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

          <div className="relative">
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
              className="w-full min-h-[60px] max-h-[200px] rounded-xl p-4 pr-32 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none border bg-background"
              disabled={(!geminiApiKey && !perplexityApiKey) || isLoading}
            />
            
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                disabled={(!geminiApiKey && !perplexityApiKey) || isLoading || useWebSearch || useReasoning || useDeveloperMode}
                title="Attach images"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={useDeveloperMode ? "default" : "ghost"}
                      size="icon"
                      disabled={!geminiApiKey || isLoading || useWebSearch || useReasoning}
                      className={cn(
                        "transition-all duration-200 overflow-hidden",
                        useDeveloperMode && "w-[140px]",
                        !useDeveloperMode && "w-10"
                      )}
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
                  <TooltipContent>
                    <p>Switch to developer mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={useReasoning ? "default" : "ghost"}
                      size="icon"
                      disabled={!perplexityApiKey || isLoading || useWebSearch || useDeveloperMode}
                      className={cn(
                        "transition-all duration-200",
                        useReasoning && "w-[110px]",
                        !useReasoning && "w-10"
                      )}
                      onClick={() => {
                        setUseReasoning(!useReasoning);
                        if (useWebSearch) setUseWebSearch(false);
                      }}
                    >
                      <Lightbulb className="w-4 h-4" />
                      {useReasoning && <span className="ml-2">REASON</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reason with DeepSeek R1 (US Hosted)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={useWebSearch ? "default" : "ghost"}
                      size="icon"
                      disabled={!perplexityApiKey || isLoading || useReasoning || useDeveloperMode}
                      className={cn(
                        "transition-all duration-200",
                        useWebSearch && "w-[90px]",
                        !useWebSearch && "w-10"
                      )}
                      onClick={() => {
                        setUseWebSearch(!useWebSearch);
                        if (useReasoning) setUseReasoning(false);
                      }}
                    >
                      <Globe2 className="w-4 h-4" />
                      {useWebSearch && <span className="ml-2">WEB</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search the web</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                onClick={handleSubmit}
                disabled={(!geminiApiKey && !perplexityApiKey) || isLoading || (!message.trim() && selectedImages.length === 0)}
                size="icon"
                className="bg-primary"
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

          {!geminiApiKey && !perplexityApiKey && (
            <p className="text-center text-muted-foreground mt-4">
              Please set your API keys in the settings to start chatting
            </p>
          )}
        </div>
      </div>
      
      <SettingsDialog 
        onApiKeySet={setGeminiApiKey} 
        onPerplexityApiKeySet={setPerplexityApiKey}
      />
    </main>
  );
}