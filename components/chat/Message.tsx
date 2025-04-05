import { useState, useRef, useEffect } from 'react';
import { ChevronDown, FileText, ArrowUp, Download } from 'lucide-react';
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
  isGeneratingQuestions?: boolean;
}

// Language logo mapping
const getLanguageLogo = (language: string): string => {
  const logos: { [key: string]: string } = {
    javascript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    typescript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    jsx: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    tsx: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    java: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    cpp: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    'c++': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    c: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
    dart: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg',
    flutter: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg',
    kotlin: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
    ruby: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
    php: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
    swift: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
    go: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
    rust: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg',
    csharp: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
    'c#': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
    html: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
    css: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
    sql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    yaml: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/yaml/yaml-original.svg',
    json: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    xml: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/xml/xml-original.svg',
    markdown: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/markdown/markdown-original.svg',
    bash: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
    shell: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
    dockerfile: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
    scala: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/scala/scala-original.svg',
    haskell: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/haskell/haskell-original.svg',
    lua: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/lua/lua-original.svg',
    r: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg',
    perl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/perl/perl-original.svg',
    elixir: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elixir/elixir-original.svg',
    clojure: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/clojure/clojure-original.svg',
    erlang: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/erlang/erlang-original.svg',
    nim: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nim/nim-original.svg',
    zig: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/zig/zig-original.svg',
    julia: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/julia/julia-original.svg',
    matlab: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/matlab/matlab-original.svg',
    fortran: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fortran/fortran-original.svg',
    solidity: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/solidity/solidity-original.svg',
    vue: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
    react: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    angular: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
    svelte: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg',
    graphql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/graphql/graphql-plain.svg',
    sass: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg',
    less: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/less/less-plain-wordmark.svg',
    webpack: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/webpack/webpack-original.svg',
    babel: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/babel/babel-original.svg',
    nginx: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg',
    apache: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apache/apache-original.svg',
    mongodb: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
    postgresql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    redis: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg',
    text: 'https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme/icons/file.svg',
    plaintext: 'https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme/icons/file.svg',
    txt: 'https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme/icons/file.svg',
    csv: 'https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/table.svg',
  };
  return logos[language.toLowerCase()] || '';
};

export const Message = ({
  message,
  index,
  isLoading,
  currentMessageIndex,
  expandedThinking,
  setExpandedThinking,
  followUpQuestions = [],
  onQuestionClick,
  isGeneratingQuestions
}: MessageProps) => {
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const [thinkingTime, setThinkingTime] = useState(0);
  const [hasFinishedThinking, setHasFinishedThinking] = useState(false);
  const thinkingTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (index === currentMessageIndex && isLoading) {
      const hasThinkTag = message.content.includes('<think>');
      const hasEndThinkTag = message.content.includes('</think>');

      if (hasThinkTag && !hasEndThinkTag) {
        // Only start/continue timer if we're in thinking phase
        thinkingTimerRef.current = setInterval(() => {
          setThinkingTime(prev => prev + 0.1);
        }, 100);
      } else if (hasEndThinkTag && !hasFinishedThinking) {
        // Stop timer when thinking ends and mark as finished
        if (thinkingTimerRef.current) {
          clearInterval(thinkingTimerRef.current);
        }
        setHasFinishedThinking(true);
      }

      return () => {
        if (thinkingTimerRef.current) {
          clearInterval(thinkingTimerRef.current);
        }
      };
    } else if (!isLoading) {
      // Clear timer when loading stops but keep the time
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
      }
    }
  }, [index, currentMessageIndex, isLoading, message.content, hasFinishedThinking]);

  // Reset states when message changes
  useEffect(() => {
    setThinkingTime(0);
    setHasFinishedThinking(false);
  }, [message.content === '']);

  const processThinkingContent = (content: string) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    const thinking = thinkMatch ? thinkMatch[1].trim() : '';
    
    // Extract thinking time if present in the content
    const timeMatch = content.match(/<thinkingTime>([\d\.]+)<\/thinkingTime>/);
    const extractedTime = timeMatch ? parseFloat(timeMatch[1]) : 0;
    
    // If we have extracted time, use it
    if (extractedTime > 0 && thinkingTime === 0) {
      setThinkingTime(extractedTime);
    }
    
    const mainContent = content
      .replace(/<think>[\s\S]*?<\/think>/, '')
      .replace(/<thinkingTime>[\d\.]+<\/thinkingTime>/, '')
      .trim();
      
    return { thinking, mainContent };
  };

  const handleCopyClick = (text: string) => {
    const blockId = `${index}-${text}`;
    navigator.clipboard.writeText(text);
    setCopiedBlockId(blockId);
    setTimeout(() => setCopiedBlockId(null), 2000);
  };

  const handleDownloadClick = (code: string, language: string) => {
    // Map language to file extension
    const extensionMap: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      'c++': 'cpp',
      ruby: 'rb',
      php: 'php',
      swift: 'swift',
      go: 'go',
      rust: 'rs',
      csharp: 'cs',
      html: 'html',
      css: 'css',
      sql: 'sql',
      yaml: 'yml',
      json: 'json',
      xml: 'xml',
      markdown: 'md',
      bash: 'sh',
      shell: 'sh',
      dockerfile: 'Dockerfile',
      env: '.env'
    };

    // Generate filename based on content and language
    const extension = extensionMap[language.toLowerCase()] || language.toLowerCase();
    let filename = '';
    
    // Try to infer a meaningful name from the first line or content
    const firstLine = code.split('\n')[0].toLowerCase();
    if (firstLine.includes('class')) {
      filename = firstLine.split('class')[1].trim().split(/[\s{]/)[0];
    } else if (firstLine.includes('function')) {
      filename = firstLine.split('function')[1].trim().split(/[\s(]/)[0];
    } else if (language === 'env') {
      filename = '.env';
    } else {
      // Default name based on type of content
      if (code.includes('router') || code.includes('app.use')) {
        filename = 'routes';
      } else if (code.includes('component') || code.includes('render')) {
        filename = 'component';
      } else if (code.includes('test') || code.includes('describe')) {
        filename = 'test';
      } else {
        filename = 'code';
      }
    }

    // Create file and trigger download
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename === '.env' ? filename : `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
              <div className="flex items-center gap-2">
                <span>Show thinking</span>
                <span className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {thinkingTime.toFixed(1)}s
                </span>
              </div>
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
            p: ({ children }) => {
              return <p className="mb-4 last:mb-0">{children}</p>;
            },
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const isInline = !match;
              
              if (!isInline && language) {
                const codeString = String(children).replace(/\n$/, '');
                const blockId = `${index}-${codeString}`;
                const languageLogo = getLanguageLogo(language);
                return (
                  <div className="relative group rounded-[4px] overflow-hidden mb-6">
                    <div className="h-12 flex items-center justify-between px-4 bg-gray-800 dark:bg-secondary/50 border-b border-border/40">
                      <div className="flex items-center gap-4">
                        <div className="h-full flex items-center gap-1.5 text-xs text-gray-200 dark:text-muted-foreground font-['Space_Mono'] lowercase">
                          {languageLogo && (
                            <img 
                              src={languageLogo} 
                              alt={`${language} logo`} 
                              className="w-3.5 h-3.5"
                            />
                          )}
                          {language}
                        </div>
                        <div className="text-[11px] text-cyan-400/90 dark:text-cyan-300/90 font-['Space_Mono'] flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-cyan-500/90 dark:bg-cyan-400/90" />
                          Use code with caution
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadClick(codeString, language)}
                          className="flex items-center gap-2 text-xs text-gray-200 hover:text-white dark:text-muted-foreground dark:hover:text-foreground transition-colors"
                        >
                          <div className="relative flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-700/80 dark:hover:bg-secondary/80 transition-all duration-200">
                            <Download className="w-4 h-4" />
                          </div>
                        </button>
                        <button
                          onClick={() => handleCopyClick(codeString)}
                          className="flex items-center gap-2 text-xs text-gray-200 hover:text-white dark:text-muted-foreground dark:hover:text-foreground transition-colors"
                        >
                          <div className="relative flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-700/80 dark:hover:bg-secondary/80 transition-all duration-200">
                            <div className="relative w-4 h-4">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className={cn(
                                  "absolute inset-0 w-4 h-4 transition-all duration-200",
                                  copiedBlockId === blockId ? "opacity-0 scale-75" : "opacity-100 scale-100"
                                )}
                              >
                                <path
                                  d="M6 11C6 8.17157 6 6.75736 6.87868 5.87868C7.75736 5 9.17157 5 12 5H15C17.8284 5 19.2426 5 20.1213 5.87868C21 6.75736 21 8.17157 21 11V16C21 18.8284 21 20.2426 20.1213 21.1213C19.2426 22 17.8284 22 15 22H12C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V11Z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                />
                                <path
                                  d="M6 19C4.34315 19 3 17.6569 3 16V10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H15C16.6569 2 18 3.34315 18 5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                />
                              </svg>
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className={cn(
                                  "absolute inset-0 w-4 h-4 text-green-500 transition-all duration-200",
                                  copiedBlockId === blockId ? "opacity-100 scale-100" : "opacity-0 scale-75"
                                )}
                              >
                                <path
                                  d="M4.5 12.75L10.5 18.75L19.5 5.25"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                    <SyntaxHighlighter
                      language={language}
                      style={{
                        ...oneDark,
                        'pre[class*="language-"]': {
                          ...oneDark['pre[class*="language-"]'],
                          background: 'hsl(200, 25%, 10%)', // Modern dark cyan tint
                          fontFamily: "'Space Mono', monospace",
                        },
                        'code[class*="language-"]': {
                          ...oneDark['code[class*="language-"]'],
                          background: 'hsl(200, 25%, 10%)', // Modern dark cyan tint
                          fontFamily: "'Space Mono', monospace",
                        }
                      }}
                      showLineNumbers={true}
                      lineNumberStyle={{
                        minWidth: '3.5em',
                        paddingRight: '1em',
                        textAlign: 'right',
                        color: 'hsl(200, 10%, 45%)',
                        fontFamily: "'Space Mono', monospace",
                        borderRight: '1px solid hsl(200, 15%, 15%)',
                        marginRight: '1em',
                        userSelect: 'none'
                      }}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        borderRadius: '0 0 4px 4px',
                        fontSize: '0.875rem',
                        fontFamily: "'Space Mono', monospace",
                        background: 'hsl(200, 25%, 10%)', // Modern dark cyan tint
                      }}
                      className="syntax-highlighter"
                      wrapLongLines={false}
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
                <table {...props} className="border-collapse">{children}</table>
              </TableWrapper>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2.5 text-left text-sm font-medium border-b bg-secondary/10">{children}</th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2.5 text-sm border-b">{children}</td>
            ),
          }}
        >
          {mainContent}
        </ReactMarkdown>

        {!isLoading && mainContent && (
          <div className="mt-4 flex justify-start opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => handleCopyClick(mainContent)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-all duration-200">
                <div className="relative w-4 h-4">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={cn(
                      "absolute inset-0 w-4 h-4 transition-all duration-200",
                      copiedBlockId === `${index}-${mainContent}` ? "opacity-0 scale-75" : "opacity-100 scale-100"
                    )}
                  >
                    <path
                      d="M6 11C6 8.17157 6 6.75736 6.87868 5.87868C7.75736 5 9.17157 5 12 5H15C17.8284 5 19.2426 5 20.1213 5.87868C21 6.75736 21 8.17157 21 11V16C21 18.8284 21 20.2426 20.1213 21.1213C19.2426 22 17.8284 22 15 22H12C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V11Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M6 19C4.34315 19 3 17.6569 3 16V10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H15C16.6569 2 18 3.34315 18 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={cn(
                      "absolute inset-0 w-4 h-4 text-green-500 transition-all duration-200",
                      copiedBlockId === `${index}-${mainContent}` ? "opacity-100 scale-100" : "opacity-0 scale-75"
                    )}
                  >
                    <path
                      d="M4.5 12.75L10.5 18.75L19.5 5.25"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="relative">
                  <span className={cn(
                    "inline-block transition-all duration-200",
                    copiedBlockId === `${index}-${mainContent}` ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                  )}>
                    Copy answer
                  </span>
                  <span className={cn(
                    "absolute left-0 top-0 inline-block transition-all duration-200",
                    copiedBlockId === `${index}-${mainContent}` ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                  )}>
                    Copied!
                  </span>
                </span>
              </div>
            </button>
          </div>
        )}

        {!isLoading && mainContent && followUpQuestions && followUpQuestions.length > 0 && index === currentMessageIndex && (
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

              <div className="grid gap-2">
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

        {isGeneratingQuestions && index === currentMessageIndex && (
          <div className="mt-8 relative animate-fade-in">
            <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/80 via-primary/50 to-transparent" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-primary/90" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary animate-ping opacity-75" />
                </div>
                <h3 className="text-sm font-medium bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent flex items-center gap-2">
                  Generating Related Questions
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse" />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse [animation-delay:200ms]" />
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/50 animate-pulse [animation-delay:400ms]" />
                </h3>
              </div>

              <div className="grid gap-2">
                {[1, 2, 3, 4].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 w-full p-3 text-sm rounded-lg bg-background/40 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.05] animate-pulse"
                  >
                    <div className="shrink-0 w-6 h-6 rounded-md bg-primary/5" />
                    <div className="flex-1 h-4 bg-primary/5 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 