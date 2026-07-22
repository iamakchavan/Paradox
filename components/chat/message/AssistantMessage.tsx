"use client";

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { DotmSquare12 } from '@/components/ui/dotm-square-12';
import { ResearchTimeline } from '../ResearchTimeline';
import { MessageMarkdown } from './markdown-renderer';
import { MessageActions } from './MessageActions';
import { ParadoxTaskTimeline } from './ParadoxTaskTimeline';
import { SearchStatus } from './SearchStatus';
import { DeepResearchReportCard } from '@/components/artifacts/DeepResearchReportCard';
import { ArtifactDocumentCard } from '@/components/artifacts/ArtifactDocumentCard';
import type { ParsedMessageContent } from './types';

interface Props {
  parsed: ParsedMessageContent;
  rawContent: string;
  index: number;
  isStreaming: boolean;
  isThinkingActive: boolean;
  onBranchOff?: (index: number) => void;
  chatId?: string | null;
  messageId?: number;
}

export const AssistantMessage = memo(({
  parsed,
  rawContent,
  index,
  isStreaming,
  isThinkingActive,
  onBranchOff,
  chatId,
  messageId,
}: Props) => (
  <div className={cn(
    'px-2 sm:px-4 mb-12 text-foreground message-viewport-contain',
    isStreaming && 'streaming-message',
  )}>
    {isThinkingActive && (
      <div className="flex items-center gap-2 sm:gap-2.5 mb-4">
        <div className="w-[19px] h-[19px] sm:w-[21px] sm:h-[21px] flex items-center justify-center overflow-visible">
          <DotmSquare12
            size={19}
            dotSize={3}
            cellPadding={1}
            speed={1.35}
            opacityBase={0.12}
            opacityMid={0.42}
            opacityPeak={1}
            className="text-zinc-500/80 dark:text-zinc-400/80"
          />
        </div>
        <span className="thinking-shine text-sm sm:text-base font-medium">Thinking...</span>
      </div>
    )}
    <div className="relative group w-full">
      {parsed.steps.length > 0 && (
        <ResearchTimeline
          steps={parsed.steps}
          isLoading={isStreaming}
          researchTime={parsed.researchTime}
        />
      )}
      {parsed.artifact && chatId && messageId !== undefined && (
        <DeepResearchReportCard
          artifact={parsed.artifact}
          chatId={chatId}
          messageId={messageId}
          sources={parsed.allSearchResults}
          researchTime={parsed.researchTime}
          isMessageStreaming={isStreaming}
        />
      )}
      {parsed.artifactIds.map(artifactId => (
        <ArtifactDocumentCard key={artifactId} artifactId={artifactId} />
      ))}
      {parsed.toolSteps.length > 0 && (
        <ParadoxTaskTimeline steps={parsed.toolSteps} isStreaming={isStreaming} />
      )}
      {parsed.searchLoadingQuery
        && !parsed.searchData
        && isStreaming
        && parsed.toolSteps.length === 0 && (
          <SearchStatus query={parsed.searchLoadingQuery} />
        )}
      <MessageMarkdown
        content={parsed.processedContent}
        searchMap={parsed.searchMap}
        isStreaming={isStreaming}
        messageContent={rawContent}
        messageIndex={index}
      />
      {!isStreaming && parsed.mainContent && (
        <MessageActions
          content={parsed.mainContent}
          index={index}
          onBranchOff={onBranchOff}
          sources={parsed.allSearchResults}
        />
      )}
    </div>
  </div>
));
AssistantMessage.displayName = 'AssistantMessage';
