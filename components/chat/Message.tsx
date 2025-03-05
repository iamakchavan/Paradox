import { useState } from 'react';
import { ChevronDown, FileText, ArrowUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { TableWrapper } from './TableWrapper';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    images?: string[];
    pdfs?: { name: string; data: string }[];
  };
  index: number;
  isLoading: boolean;
  currentMessageIndex: number;
  expandedThinking: number[];
  setExpandedThinking: (value: (prev: number[]) => number[]) => void;
  followUpQuestions?: string[];
  onQuestionClick?: (question: string) => void;
}

export const Message = ({
  message,
  index,
  isLoading,
  currentMessageIndex,
  expandedThinking,
  setExpandedThinking,
  followUpQuestions = [],
  onQuestionClick
}: MessageProps) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const processThinkingContent = (content: string) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    const thinking = thinkMatch ? thinkMatch[1].trim() : '';
    const mainContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    return { thinking, mainContent };
  };

  const handleCopyClick = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-12">
        <div className="bg-white dark:bg-white/10 border border-black/[0.08] dark:border-white/[0.08] rounded-2xl rounded-br-none px-3 sm:px-4 py-2 max-w-[90%] sm:max-w-[85%] text-sm space-y-2">
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.images.map((img, imgIndex) => (
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
          {message.pdfs && message.pdfs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.pdfs.map((pdf, pdfIndex) => (
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
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  const { thinking, mainContent } = processThinkingContent(message.content);

  return (
    <div className="pl-2 sm:pl-4 pr-8 sm:pr-12 mb-12 text-foreground">
      {thinking && (
        <div className="mb-4">
          <button
            onClick={() => setExpandedThinking((prev: number[]) => 
              prev.includes(index) 
                ? prev.filter((i: number) => i !== index)
                : [...prev, index]
            )}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              expandedThinking.includes(index) ? "rotate-180" : ""
            )} />
            {index === currentMessageIndex && isLoading && !mainContent ? (
              <span className="thinking-shine">Thinking...</span>
            ) : (
              "Show thinking"
            )}
          </button>
          {expandedThinking.includes(index) && (
            <div className={cn(
              "mt-2 pl-4 border-l-2 border-muted text-muted-foreground text-sm tracking-wide",
              index === currentMessageIndex && isLoading && "animate-thinking"
            )} style={{ fontFamily: 'Instrument Serif', fontStyle: 'italic', letterSpacing: '0.025em' }}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                className="prose dark:prose-invert max-w-none prose-sm"
              >
                {thinking}
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
                const codeString = String(children).replace(/\n$/, '');
                return (
                  <div className="relative group">
                    <div className="absolute -right-4 sm:-right-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopyClick(codeString, index)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <div className="p-1.5 hover:bg-secondary rounded-md transition-colors relative">
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("text-muted-foreground", copiedIndex === index ? "opacity-0" : "opacity-100")}>
                            <path d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                          </svg>
                          <svg className={cn("w-[15px] h-[15px] absolute inset-0 m-auto text-green-500", copiedIndex === index ? "opacity-100" : "opacity-0")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <span className={cn("transition-opacity", copiedIndex === index ? "opacity-0" : "opacity-100")}>
                          Copy
                        </span>
                        <span className={cn("absolute right-0 transition-opacity", copiedIndex === index ? "opacity-100" : "opacity-0")}>
                          Copied!
                        </span>
                      </button>
                    </div>
                    <SyntaxHighlighter
                      language={language}
                      style={oneDark}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        borderRadius: '0.5rem',
                      }}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              return <code {...props} className="bg-secondary/30 px-1.5 py-0.5 rounded-md text-[0.9em]">{children}</code>;
            },
            table: ({ children, ...props }) => (
              <TableWrapper 
                isLoading={isLoading}
                messageContent={message.content}
                messageIndex={index}
                currentMessageIndex={currentMessageIndex}
              >
                <table {...props}>{children}</table>
              </TableWrapper>
            ),
          }}
        >
          {mainContent}
        </ReactMarkdown>

        {!isLoading && mainContent && followUpQuestions.length > 0 && index === currentMessageIndex && (
          <div className="mt-8 relative">
            <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/80 via-primary/50 to-transparent" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-primary/90" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary animate-ping opacity-75" />
                </div>
                <h3 className="text-sm font-medium bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Related Questions
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {followUpQuestions.map((question, promptIndex) => (
                  <button
                    key={promptIndex}
                    onClick={() => onQuestionClick?.(question)}
                    className="group/button relative flex items-center gap-3 w-full p-3 text-sm text-left rounded-lg bg-background/40 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.05] hover:bg-background dark:hover:bg-white/[0.05] hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-200 shadow-sm"
                    disabled={isLoading}
                  >
                    <div className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-primary/5 dark:bg-primary/5 group-hover/button:bg-primary/10 dark:group-hover/button:bg-primary/10 transition-colors duration-200">
                      <ArrowUp 
                        className="w-3 h-3 text-primary/60 rotate-45 group-hover/button:rotate-[30deg] group-hover/button:text-primary/80 transition-all duration-200"
                      />
                    </div>
                    <span className="text-muted-foreground group-hover/button:text-foreground transition-colors duration-200">
                      {question}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 