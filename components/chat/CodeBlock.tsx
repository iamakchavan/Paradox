"use client";

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { getLanguageLogo } from '@/utils/language';
import { useCustomToast } from '@/components/ui/custom-toast';

interface CodeBlockProps {
  language: string;
  codeString: string;
  index: number;
  isStreaming?: boolean;
}

export const CodeBlock = ({ language, codeString, index, isStreaming = false }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const codeTheme = isDark ? themes.oneDark : themes.oneLight;
  const { showToast } = useCustomToast();

  const handleCopyClick = () => {
    const scrollPos = window.scrollY;
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    showToast({
      message: 'Code copied to clipboard',
      type: 'success',
      mode: 'capsule',
    });
    window.scrollTo(0, scrollPos);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadClick = () => {
    // Map language to file extension
    const extensionMap: { [key: string]: string } = {
      javascript: 'js',
      typescript: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      'c++': 'cpp',
      c: 'c',
      csharp: 'cs',
      'c#': 'cs',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      php: 'php',
      swift: 'swift',
      kotlin: 'kt',
      scala: 'scala',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',
      xml: 'xml',
      json: 'json',
      yaml: 'yml',
      yml: 'yml',
      markdown: 'md',
      md: 'md',
      sql: 'sql',
      shell: 'sh',
      bash: 'sh',
      zsh: 'zsh',
      powershell: 'ps1',
      dockerfile: 'Dockerfile',
      docker: 'Dockerfile',
      env: 'env',
      gitignore: 'gitignore',
      ini: 'ini',
      toml: 'toml',
      lua: 'lua',
      perl: 'pl',
      r: 'r',
      dart: 'dart',
      vue: 'vue',
      svelte: 'svelte',
      graphql: 'graphql',
      gql: 'graphql',
      terraform: 'tf',
      tf: 'tf',
      hcl: 'hcl',
      puppet: 'pp',
      handlebars: 'hbs',
      hbs: 'hbs',
      maxscript: 'ms',
      arduino: 'ino',
      cairo: 'cairo',
      apl: 'apl',
      malbolge: 'mal',
      brainfuck: 'bf',
      lolcode: 'lol',
      intercal: 'i',
      spl: 'spl',
      chef: 'chef',
      unlambda: 'unl',
      varfuck: 'vf',
      whitespace: 'ws',
      prolog: 'pl',
      forth: 'fth',
      ceylon: 'ceylon',
      clarity: 'clar',
      crystal: 'cr',
      gherkin: 'feature',
      cucumber: 'feature',
      nginx: 'nginx.conf',
      apache: 'htaccess',
      properties: 'properties',
      config: 'config',
      conf: 'conf',
      rc: 'rc',
      editorconfig: 'editorconfig',
      npmrc: 'npmrc',
      yarnrc: 'yarnrc',
      log: 'log'
    };

    // Special filename handling for certain types
    let filename = '';
    if (language === 'dockerfile') {
      filename = 'Dockerfile';
    } else if (language === 'env') {
      filename = '.env';
    } else if (language === 'gitignore') {
      filename = '.gitignore';
    } else if (language === 'editorconfig') {
      filename = '.editorconfig';
    } else if (language === 'npmrc') {
      filename = '.npmrc';
    } else if (language === 'yarnrc') {
      filename = '.yarnrc';
    } else if (language === 'nginx') {
      filename = 'nginx.conf';
    } else if (language === 'apache') {
      filename = '.htaccess';
    } else {
      // Default name based on type of content
      const extension = extensionMap[language.toLowerCase()] || language;
      filename = `code.${extension}`;
    }

    // Create file and trigger download
    const blob = new Blob([codeString], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const languageLogo = getLanguageLogo(language);

  if (isStreaming) {
    return (
      <div className="relative group rounded-xl sm:rounded-2xl overflow-hidden mb-6 border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm bg-background">
        <div className="h-9 sm:h-10 flex items-center justify-between px-3 sm:px-4 bg-zinc-100/90 dark:bg-zinc-900/90 border-b border-zinc-200/65 dark:border-zinc-800/65">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-full flex items-center gap-1.5 text-xs text-muted-foreground font-['Space_Mono'] lowercase font-semibold">
              {languageLogo && (
                <img 
                  src={languageLogo} 
                  alt={`${language} logo`} 
                  className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", language.toLowerCase() === 'rust' && "dark:invert")}
                  style={{ margin: 0 }}
                />
              )}
              {language}
            </div>
          </div>
        </div>
        <pre className="p-3 sm:p-4 overflow-x-auto custom-scrollbar text-xs sm:text-[13px] font-mono whitespace-pre bg-zinc-50 dark:bg-zinc-950/20" style={{ margin: 0, fontFamily: "var(--font-space-mono), monospace" }}>
          <code>{codeString}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="relative group rounded-xl sm:rounded-2xl overflow-hidden mb-6 border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm bg-background">
      <div className="h-9 sm:h-10 flex items-center justify-between px-3 sm:px-4 bg-zinc-100/90 dark:bg-zinc-900/90 border-b border-zinc-200/65 dark:border-zinc-800/65">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-full flex items-center gap-1.5 text-xs text-muted-foreground font-mono lowercase font-semibold">
            {languageLogo && (
              <img 
                src={languageLogo} 
                alt={`${language} logo`} 
                className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", language.toLowerCase() === 'rust' && "dark:invert")}
                style={{ margin: 0 }}
              />
            )}
            {language}
          </div>
          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono hidden sm:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            Use code with caution
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleDownloadClick}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            title="Download code file"
          >
            <div className="relative flex items-center gap-1.5 sm:gap-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10 transition-all duration-200">
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleCopyClick();
            }}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            title="Copy code to clipboard"
          >
            <div className="relative flex items-center gap-1.5 sm:gap-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10 transition-all duration-200">
              <div className="relative w-3 h-3 sm:w-3.5 sm:h-3.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className={cn(
                    "absolute inset-0 w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all duration-200",
                    copied ? "opacity-0 scale-75" : "opacity-100 scale-100"
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
                    "absolute inset-0 w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-500 transition-all duration-200",
                    copied ? "opacity-100 scale-100" : "opacity-0 scale-75"
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
      <Highlight
        theme={codeTheme}
        code={codeString}
        language={language || 'text'}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={cn(className, 'p-3 sm:p-4 overflow-x-auto custom-scrollbar text-xs sm:text-[13px]')} style={{
            ...style,
            margin: 0,
            background: isDark ? 'hsl(230, 12%, 11%)' : 'hsl(210, 15%, 96.5%)',
            fontFamily: "var(--font-space-mono), monospace",
          }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
};
