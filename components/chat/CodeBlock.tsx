"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Code2, Copy, Download, WrapText } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useCustomToast } from '@/components/ui/custom-toast';

interface CodeBlockProps {
  language: string;
  codeString: string;
  index: number;
  isStreaming?: boolean;
}

const LANGUAGE_EXTENSIONS: Record<string, string> = {
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
  log: 'log',
};

const SPECIAL_FILENAMES: Record<string, string> = {
  dockerfile: 'Dockerfile',
  env: '.env',
  gitignore: '.gitignore',
  editorconfig: '.editorconfig',
  npmrc: '.npmrc',
  yarnrc: '.yarnrc',
  nginx: 'nginx.conf',
  apache: '.htaccess',
};

const ACTION_CLASS =
  'flex h-7 w-7 shrink-0 cursor-pointer select-none items-center justify-center rounded-md text-zinc-500 transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] hover:bg-black/[0.055] hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-zinc-100';

function getCodeFilename(language: string) {
  const normalizedLanguage = language.toLowerCase() || 'text';
  if (SPECIAL_FILENAMES[normalizedLanguage]) {
    return SPECIAL_FILENAMES[normalizedLanguage];
  }

  const extension = LANGUAGE_EXTENSIONS[normalizedLanguage] || normalizedLanguage;
  return `code.${extension}`;
}

export const CodeBlock = ({ language, codeString, isStreaming = false }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { resolvedTheme } = useTheme();
  const { showToast } = useCustomToast();
  const isDark = resolvedTheme === 'dark';
  const codeTheme = isDark ? themes.oneDark : themes.oneLight;
  const languageLabel = language || 'text';
  const codeLayoutClass = wrapLines
    ? 'overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere]'
    : 'overflow-x-auto whitespace-pre';

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleCopyClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      showToast({
        message: 'Code copied to clipboard',
        type: 'success',
        mode: 'capsule',
      });

      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, [codeString, showToast]);

  const handleDownloadClick = useCallback(() => {
    const blob = new Blob([codeString], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = getCodeFilename(languageLabel);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }, [codeString, languageLabel]);

  const toolbar = (
    <div className="flex h-10 items-center justify-between border-b border-zinc-200/75 px-3 dark:border-white/[0.07] dark:bg-[hsl(var(--surface-subtle)/0.7)]">
      <div className="flex min-w-0 select-none items-center gap-2">
        <Code2 className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.8} />
        <span className="truncate font-mono text-[11.5px] font-medium lowercase text-zinc-600 dark:text-zinc-300">
          {languageLabel}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setWrapLines((current) => !current)}
          className={cn(
            ACTION_CLASS,
            wrapLines &&
              'bg-black/[0.055] text-zinc-900 dark:bg-white/[0.08] dark:text-zinc-100'
          )}
          aria-label={wrapLines ? 'Disable line wrapping' : 'Wrap long lines'}
          aria-pressed={wrapLines}
          title={wrapLines ? 'Disable line wrapping' : 'Wrap long lines'}
        >
          <WrapText className="h-3.5 w-3.5" />
        </button>
        {!isStreaming && (
          <>
            <button
              type="button"
              onClick={handleDownloadClick}
              className={ACTION_CLASS}
              aria-label="Download code file"
              title="Download code file"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCopyClick}
              className={ACTION_CLASS}
              aria-label={copied ? 'Code copied' : 'Copy code'}
              title={copied ? 'Copied' : 'Copy code'}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div
      data-not-typeset
      className="my-6 overflow-hidden rounded-[10px] border border-zinc-200/90 bg-white dark:border-white/[0.09] dark:bg-[hsl(var(--surface-panel))]"
    >
      {toolbar}
      <div className="bg-zinc-50/80 dark:bg-[hsl(var(--surface-panel))]">
        {isStreaming ? (
          <pre
            className={cn(
              'custom-scrollbar m-0 p-4 font-mono text-[13px] leading-[1.65] text-zinc-800 sm:px-[18px] dark:text-zinc-200',
              codeLayoutClass
            )}
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            tabIndex={0}
            aria-label={`${languageLabel} code`}
          >
            <code>{codeString}</code>
          </pre>
        ) : (
          <Highlight theme={codeTheme} code={codeString} language={languageLabel}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={cn(
                  className,
                  'custom-scrollbar m-0 p-4 font-mono text-[13px] leading-[1.65] sm:px-[18px]',
                  codeLayoutClass
                )}
                style={{
                  ...style,
                  margin: 0,
                  backgroundColor: 'transparent',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
                tabIndex={0}
                aria-label={`${languageLabel} code`}
              >
                {tokens.map((line, lineIndex) => (
                  <div key={lineIndex} {...getLineProps({ line })}>
                    {line.map((token, tokenIndex) => (
                      <span key={tokenIndex} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        )}
      </div>
    </div>
  );
};
