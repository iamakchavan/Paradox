"use client";

import { memo, useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessageData } from './types';

export const UserMessage = memo(({ message }: { message: ChatMessageData }) => {
  const [expanded, setExpanded] = useState(false);
  const lines = message.content.split('\n');
  const shouldTruncate = message.content.length > 280 || lines.length > 4;
  let displayContent = message.content;
  if (shouldTruncate && !expanded) {
    displayContent = lines.length > 4
      ? `${lines.slice(0, 4).join('\n')}...`
      : `${message.content.slice(0, 280)}...`;
  }
  return (
    <div className="flex justify-end mb-12">
      <div className="bg-white dark:bg-[#121214] text-zinc-800 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800/30 rounded-[28px] rounded-br-[6px] px-5 py-3 sm:px-6 sm:py-3.5 max-w-[85%] sm:max-w-[70%] text-[15px] sm:text-base leading-relaxed space-y-3">
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5">
            {message.images.map((image, index) => (
              <div key={index} className="relative w-20 h-20">
                <img src={image} alt={`Uploaded ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
              </div>
            ))}
          </div>
        )}
        {message.pdfs && message.pdfs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5">
            {message.pdfs.map((pdf, index) => (
              <div key={index} className="flex items-center gap-2 bg-secondary/20 rounded-lg p-3 border border-border/50">
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
        <div className="whitespace-pre-wrap break-words leading-relaxed">{displayContent}</div>
        {shouldTruncate && (
          <button
            onClick={() => setExpanded(previous => !previous)}
            className="text-[12px] font-semibold text-zinc-500/90 dark:text-zinc-400/90 hover:text-zinc-800 dark:hover:text-zinc-100 flex items-center gap-0.5 mt-1 select-none transition-colors duration-150 active:scale-95 origin-left"
          >
            <span>{expanded ? 'See less' : 'See more'}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', expanded && 'rotate-180')} />
          </button>
        )}
      </div>
    </div>
  );
});
UserMessage.displayName = 'UserMessage';

