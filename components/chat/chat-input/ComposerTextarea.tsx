"use client";

import type { Ref } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  textareaRef: Ref<HTMLTextAreaElement>;
  value: string;
  expanded: boolean;
  isMobile: boolean;
  isLoading: boolean;
  isSendDisabled: boolean;
  isInputDisabled: boolean;
  searchEnabled: boolean;
  researchEnabled: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
}

export function ComposerTextarea(props: Props) {
  return (
    <div className={cn('min-w-0 self-center', props.expanded ? 'w-full' : 'flex-1')}>
      <textarea
        ref={props.textareaRef}
        rows={1}
        value={props.value}
        onChange={event => props.onChange(event.target.value)}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        onKeyDown={event => {
          if (event.key !== 'Enter' || props.isMobile || event.shiftKey) return;
          event.preventDefault();
          if (!props.isLoading && !props.isSendDisabled) props.onSubmit();
        }}
        onPaste={props.onPaste}
        placeholder={props.searchEnabled
          ? 'Search the web'
          : props.researchEnabled ? 'Run deep research...' : 'Ask anything...'}
        className={cn(
          'w-full placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 resize-none border-0 bg-transparent text-foreground',
          'selection:bg-primary/20 selection:text-foreground scrollbar-none block text-base',
          props.expanded
            ? 'py-1 leading-relaxed overflow-y-auto whitespace-pre-wrap px-1'
            : 'py-0.5 leading-5 overflow-hidden whitespace-nowrap pl-0 pr-0.5',
        )}
        style={{ height: props.expanded ? undefined : '24px' }}
        disabled={props.isInputDisabled}
      />
    </div>
  );
}
