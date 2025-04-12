"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Paperclip, ArrowUp, Globe2, PlusCircle, Settings, X, Lightbulb, Code2, ChevronDown, FileText, Download } from 'lucide-react';
import { SettingsDialog } from '@/components/settings-dialog';
import { getGeminiApi, initGemini, streamGenerateContent } from '@/lib/gemini';
import { getPerplexityApi, initPerplexity, streamPerplexityContent } from '@/lib/perplexity';
import { getMistralApi, initMistral, streamMistralContent } from '@/lib/mistral';
import { initInception, streamInceptionContent } from '@/lib/inception';
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
import { useTheme } from 'next-themes';
import { Typewriter } from '@/components/typewriter';
import { initDeveloperMode, streamDeveloperContent } from '@/lib/developer-mode';
import Link from 'next/link';
import { TableWrapper } from '@/components/chat/TableWrapper';
import { processThinkingContent } from '@/utils/chat';
import { ChatInput } from '@/components/chat/ChatInput';
import { Message } from '@/components/chat/Message';
import { generateFollowUpQuestions } from '@/utils/followUpQuestions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  pdfs?: { name: string; data: string }[];
}

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

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [perplexityApiKey, setPerplexityApiKey] = useState<string | null>(null);
  const [mistralApiKey, setMistralApiKey] = useState<string | null>(null);
  const [inceptionApiKey, setInceptionApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedPDFs, setSelectedPDFs] = useState<{ name: string; data: string }[]>([]);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useReasoning, setUseReasoning] = useState(false);
  const [useDeveloperMode, setUseDeveloperMode] = useState(false);
  const [useFastResponse, setUseFastResponse] = useState(false);
  const [useDiffusion, setUseDiffusion] = useState(false);
  const [showDeveloperModeMessage, setShowDeveloperModeMessage] = useState(false);
  const [shouldFocus, setShouldFocus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInitialView, setIsInitialView] = useState(true);
  const { setTheme, theme } = useTheme();
  const [previousTheme, setPreviousTheme] = useState<string>('');
  const [expandedThinking, setExpandedThinking] = useState<number[]>([]);
  const [processingPDF, setProcessingPDF] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

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

  // Function to get random prompts using a seed
  const getRandomPrompts = (seed: number = 0) => {
    const usedIndices = new Set<number>();
    const result: string[] = [];
    
    // Use a deterministic way to select prompts based on the seed
    const setIndex = seed % promptSets.length;
    const promptSet = promptSets[setIndex];
    
    // Select all prompts from the same set to ensure consistency
    result.push(...promptSet);
    
    return result;
  };

  // Initialize with a fixed seed for server-side rendering
  const [suggestedPrompts, setSuggestedPrompts] = useState(() => getRandomPrompts(0));

  useEffect(() => {
    // Only update prompts on the client side after initial render
    if (typeof window !== 'undefined') {
      const timeBasedSeed = Math.floor(Date.now() / 30000); // Change every 30 seconds
      setSuggestedPrompts(getRandomPrompts(timeBasedSeed));

      // Refresh prompts every 30 seconds if the page is in initial view
      const interval = setInterval(() => {
        if (isInitialView) {
          const newSeed = Math.floor(Date.now() / 30000);
          setSuggestedPrompts(getRandomPrompts(newSeed));
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isInitialView]);

  useEffect(() => {
    const storedGeminiKey = localStorage.getItem('gemini-api-key');
    const storedPerplexityKey = localStorage.getItem('perplexity-api-key');
    const storedMistralKey = localStorage.getItem('mistral-api-key');
    const storedInceptionKey = localStorage.getItem('inception-api-key');
    
    if (storedGeminiKey) {
      initGemini(storedGeminiKey);
      initDeveloperMode(storedGeminiKey);
      setGeminiApiKey(storedGeminiKey);
    }
    if (storedPerplexityKey) {
      initPerplexity(storedPerplexityKey);
      setPerplexityApiKey(storedPerplexityKey);
    }
    if (storedMistralKey) {
      initMistral(storedMistralKey);
      setMistralApiKey(storedMistralKey);
    }
    if (storedInceptionKey) {
      initInception(storedInceptionKey);
      setInceptionApiKey(storedInceptionKey);
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
    setUseFastResponse(false);
    setUseDiffusion(false);
    setShowDeveloperModeMessage(false);
    setShouldFocus(true);
  };

  useEffect(() => {
    if (shouldFocus) {
      setShouldFocus(false);
    }
  }, [shouldFocus]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type === 'application/pdf') {
        if (useFastResponse) {
          setError('PDF uploads are not supported in fast response mode');
          continue;
        }
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
    if ((!message.trim() && selectedImages.length === 0 && selectedPDFs.length === 0) || (!geminiApiKey && !perplexityApiKey && !mistralApiKey && !inceptionApiKey)) return;
    if ((useWebSearch || useReasoning) && !perplexityApiKey) {
      setError('Please set your Perplexity API key to use web search or reasoning');
      return;
    }
    if (useFastResponse && !mistralApiKey) {
      setError('Please set your Mistral API key to use fast response mode');
      return;
    }
    if (useDiffusion && !inceptionApiKey) {
      setError('Please set your Inception Labs API key to use diffusion mode');
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
      let thinkingStartTime = 0;
      let thinkingDuration = 0;

      const promptMessage = message;

      if (useDiffusion && inceptionApiKey) {
        await streamInceptionContent(
          message,
          [
            ...history.map(msg => ({
              role: msg.role,
              content: msg.content,
              images: msg.images
            })),
            {
              role: 'user',
              content: message,
              images: selectedImages.length > 0 ? selectedImages : undefined
            }
          ],
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
      } else if (useDeveloperMode && geminiApiKey) {
        await streamDeveloperContent(
          message,
          conversation.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
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
              if (thinkingStartTime === 0) {
                thinkingStartTime = Date.now();
              }
              streamedText = '';
              return;
            }
            
            if (token.includes('</think>')) {
              if (thinkingStartTime > 0) {
                thinkingDuration = (Date.now() - thinkingStartTime) / 1000;
              }
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
                  content: thinking 
                    ? `<think>${thinking}</think><thinkingTime>${thinkingDuration.toFixed(1)}</thinkingTime>${streamedText}` 
                    : streamedText
                };
              }
              return newConv;
            });
          },
          useReasoning ? 'sonar-reasoning' : 'sonar'
        );
      } else if (useFastResponse && mistralApiKey) {
        await streamMistralContent(
          promptMessage,
          [
            ...history.map(msg => ({
              role: msg.role,
              content: msg.content,
              images: msg.images
            })),
            {
              role: 'user',
              content: promptMessage,
              images: selectedImages.length > 0 ? selectedImages : undefined
            }
          ],
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
      let thinkingStartTime = 0;
      let thinkingDuration = 0;
      
      if (useDiffusion && inceptionApiKey) {
        await streamInceptionContent(
          promptMessage,
          [
            ...history.map(msg => ({
              role: msg.role,
              content: msg.content,
              images: msg.images
            })),
            {
              role: 'user',
              content: promptMessage
            }
          ],
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
      } else if (useDeveloperMode && geminiApiKey) {
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
              if (thinkingStartTime === 0) {
                thinkingStartTime = Date.now();
              }
              streamedText = '';
              return;
            }
            
            if (token.includes('</think>')) {
              if (thinkingStartTime > 0) {
                thinkingDuration = (Date.now() - thinkingStartTime) / 1000;
              }
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
                  content: thinking 
                    ? `<think>${thinking}</think><thinkingTime>${thinkingDuration.toFixed(1)}</thinkingTime>${streamedText}` 
                    : streamedText
                };
              }
              return newConv;
            });
          },
          useReasoning ? 'sonar-reasoning' : 'sonar'
        );
      } else if (useFastResponse && mistralApiKey) {
        await streamMistralContent(
          promptMessage,
          [
            ...history.map(msg => ({
              role: msg.role,
              content: msg.content,
              images: msg.images
            })),
            {
              role: 'user',
              content: promptMessage
            }
          ],
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

  // Update the effect to handle loading state
  useEffect(() => {
    const lastMessage = conversation[conversation.length - 1];
    if (lastMessage?.role === 'assistant' && !isLoading && processThinkingContent(lastMessage.content).mainContent) {
      setIsGeneratingQuestions(true);
      setFollowUpQuestions([]); // Clear old questions while generating new ones
      generateFollowUpQuestions(processThinkingContent(lastMessage.content).mainContent)
        .then(questions => {
          setFollowUpQuestions(questions);
          setIsGeneratingQuestions(false);
        })
        .catch(() => {
          setIsGeneratingQuestions(false);
        });
    }
  }, [conversation, isLoading]);

  // Clear follow-up questions when starting a new response
  useEffect(() => {
    if (isLoading) {
      setFollowUpQuestions([]);
      setIsGeneratingQuestions(false);
    }
  }, [isLoading]);

  // Add a new useEffect to handle scroll button visibility
  useEffect(() => {
    if (isInitialView) return;
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollHeight = document.body.scrollHeight;
      const windowHeight = window.innerHeight;
      
      // Show button when scrolled up at least 200px from bottom
      const threshold = 200;
      const isNearBottom = scrollHeight - (scrollPosition + windowHeight) <= threshold;
      setShowScrollButton(!isNearBottom && scrollHeight > windowHeight + threshold);
    };
    
    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInitialView]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
              <div className="text-center animate-fade-in-up [animation-delay:200ms]">
                <p className="text-2xl sm:text-3xl font-medium tracking-wide text-foreground" style={{ fontFamily: 'Kelly Slab' }}>
                  What should I get done today?
                </p>
              </div>

              <div className="w-full max-w-2xl animate-fade-in-up [animation-delay:400ms]">
                <ChatInput
                  message={message}
                  setMessage={setMessage}
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                  geminiApiKey={geminiApiKey}
                  perplexityApiKey={perplexityApiKey}
                  useWebSearch={useWebSearch}
                  setUseWebSearch={setUseWebSearch}
                  useReasoning={useReasoning}
                  setUseReasoning={setUseReasoning}
                  useDeveloperMode={useDeveloperMode}
                  setUseDeveloperMode={setUseDeveloperMode}
                  useFastResponse={useFastResponse}
                  setUseFastResponse={setUseFastResponse}
                  useDiffusion={useDiffusion}
                  setUseDiffusion={setUseDiffusion}
                  handleFileUpload={handleFileUpload}
                  theme={theme}
                  setTheme={setTheme}
                  previousTheme={previousTheme}
                  setPreviousTheme={setPreviousTheme}
                  setShowDeveloperModeMessage={setShowDeveloperModeMessage}
                  selectedImages={selectedImages}
                  removeImage={removeImage}
                  selectedPDFs={selectedPDFs}
                  removePDF={removePDF}
                  error={error}
                  isInitialView={true}
                  shouldFocus={shouldFocus}
                />
                
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in-up [animation-delay:600ms]">
                  {suggestedPrompts.map((prompt, index) => (
                            <button
                      key={index}
                      onClick={() => handlePromptClick(prompt)}
                      className={cn(
                        "p-4 text-sm text-left rounded-md bg-white dark:bg-background",
                        "border border-black/10 dark:border-white/10",
                        "hover:border-primary/30 dark:hover:border-primary/30",
                        "transition-all duration-200",
                        "group relative overflow-hidden"
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
              {conversation.map((msg: Message, index: number) => (
                  <div key={`message-${index}-${msg.role}`} className={cn(
                    "group",
                    index === conversation.length - 1 && msg.role === 'assistant' && "animate-fade-in"
                  )}>
                  <Message
                    message={msg}
                    index={index}
                    isLoading={isLoading}
                    currentMessageIndex={conversation.length - 1}
                    expandedThinking={expandedThinking}
                    setExpandedThinking={setExpandedThinking}
                    followUpQuestions={index === conversation.length - 1 ? followUpQuestions : []}
                    onQuestionClick={handlePromptClick}
                    isGeneratingQuestions={isGeneratingQuestions}
                                  />
                                </div>
                              ))}
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
          <div className="absolute right-4 -top-14 z-20">
            <Button 
              onClick={scrollToBottom} 
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-full shadow-md border-none",
                "bg-cyan-600 text-white hover:bg-cyan-700",
                "dark:bg-cyan-800/80 dark:hover:bg-cyan-700/90",
                "transform transition-all duration-300 ease-in-out",
                "flex items-center justify-center",
                showScrollButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
              )}
              aria-label="Scroll to bottom"
            >
              <ArrowUp className="h-5 w-5 rotate-180" />
            </Button>
          </div>
          <ChatInput
            message={message}
            setMessage={setMessage}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            geminiApiKey={geminiApiKey}
            perplexityApiKey={perplexityApiKey}
            useWebSearch={useWebSearch}
            setUseWebSearch={setUseWebSearch}
            useReasoning={useReasoning}
            setUseReasoning={setUseReasoning}
            useDeveloperMode={useDeveloperMode}
            setUseDeveloperMode={setUseDeveloperMode}
            useFastResponse={useFastResponse}
            setUseFastResponse={setUseFastResponse}
            useDiffusion={useDiffusion}
            setUseDiffusion={setUseDiffusion}
            handleFileUpload={handleFileUpload}
            theme={theme}
            setTheme={setTheme}
            previousTheme={previousTheme}
            setPreviousTheme={setPreviousTheme}
            setShowDeveloperModeMessage={setShowDeveloperModeMessage}
            selectedImages={selectedImages}
            removeImage={removeImage}
            selectedPDFs={selectedPDFs}
            removePDF={removePDF}
            error={error}
            isInitialView={false}
            shouldFocus={shouldFocus}
          />
        </div>
      )}
      
      <SettingsDialog 
        onApiKeySet={setGeminiApiKey} 
        onPerplexityApiKeySet={setPerplexityApiKey}
        onMistralApiKeySet={setMistralApiKey}
        onInceptionApiKeySet={setInceptionApiKey}
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