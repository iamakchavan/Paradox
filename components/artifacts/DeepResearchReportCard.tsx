"use client";

import { memo, useCallback, useMemo } from 'react';
import { ArrowUpRight, FileText } from 'lucide-react';
import type { ParsedDeepResearchArtifact } from '@/lib/artifacts/deep-research';
import { getDeepResearchArtifactId } from '@/lib/artifacts/deep-research';
import { createArtifactBundle } from '@/lib/artifacts/snapshot';
import { artifactRepository } from '@/lib/artifacts/repository';
import { publishArtifactSnapshot } from '@/lib/artifacts/runtime-store';
import type { ArtifactSource } from '@/lib/artifacts/types';
import { formatResearchDuration } from '@/components/chat/research-timeline/research-timeline-utils';
import { DotmSquare15 } from '@/components/ui/dotm-square-15';
import { useRightWorkspaceActions } from '@/components/workspace/RightWorkspaceContext';

interface Props {
  artifact: ParsedDeepResearchArtifact;
  chatId: string;
  messageId: number;
  sources: ArtifactSource[];
  researchTime: number;
  isMessageStreaming: boolean;
}

export const DeepResearchReportCard = memo(function DeepResearchReportCard({
  artifact,
  chatId,
  messageId,
  sources,
  researchTime,
  isMessageStreaming,
}: Props) {
  const { openArtifact } = useRightWorkspaceActions();
  const artifactId = getDeepResearchArtifactId(chatId, messageId);
  const effectiveStatus = artifact.status === 'streaming' && !isMessageStreaming
    ? 'failed'
    : artifact.status;
  const snapshot = useMemo(() => createArtifactBundle({
    id: artifactId,
    chatId,
    messageId,
    title: artifact.title,
    status: effectiveStatus,
    markdown: artifact.markdown,
    sources,
  }), [artifact.markdown, artifact.title, artifactId, chatId, effectiveStatus, messageId, sources]);

  const openReport = useCallback(() => {
    publishArtifactSnapshot(snapshot);
    openArtifact(artifactId);
    void artifactRepository.upsertDraft({
      id: artifactId,
      chatId,
      messageId,
      title: artifact.title,
      status: effectiveStatus,
      markdown: artifact.markdown,
      sources,
    }).then(publishArtifactSnapshot).catch(error => {
      console.warn('[Artifact Card] Failed to seed report storage:', error);
    });
  }, [artifact.markdown, artifact.title, artifactId, chatId, effectiveStatus, messageId, openArtifact, snapshot, sources]);

  const isStreaming = effectiveStatus === 'streaming';
  const isUnavailable = effectiveStatus === 'failed' && !artifact.markdown.trim();
  return (
    <button
      type="button"
      onClick={openReport}
      disabled={isUnavailable}
      className="group my-5 flex w-full min-w-0 items-center gap-3 rounded-lg border border-foreground/[0.09] bg-foreground/[0.018] px-4 py-3.5 text-left transition-colors hover:bg-foreground/[0.035] active:bg-foreground/[0.05] disabled:cursor-default disabled:opacity-65 disabled:hover:bg-foreground/[0.018] dark:bg-white/[0.025] dark:hover:bg-white/[0.045] dark:disabled:hover:bg-white/[0.025]"
      aria-label={`${isStreaming ? 'Open report while it is being written' : 'Open report'}: ${artifact.title}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center text-foreground/65">
        {isStreaming ? (
          <DotmSquare15
            size={23}
            dotSize={3}
            cellPadding={2}
            speed={1.2}
            opacityBase={0.12}
            opacityMid={0.48}
            opacityPeak={1}
            animated
            ariaLabel="Writing research report"
            className="text-zinc-600/90 dark:text-zinc-300/90"
          />
        ) : (
          <FileText className="h-[18px] w-[18px]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground/90">
          {isUnavailable
            ? 'Report could not be completed'
            : isStreaming && !artifact.markdown
              ? 'Writing research report...'
              : artifact.title}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>{isUnavailable ? 'Synthesis stopped' : isStreaming ? 'Live report' : 'Research report'}</span>
          {!isStreaming && researchTime > 0 && <span>{formatResearchDuration(researchTime)}</span>}
          {sources.length > 0 && <span>{sources.length} sources</span>}
        </p>
      </div>
      {!isUnavailable && (
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/55 transition-colors group-hover:text-foreground/75" />
      )}
    </button>
  );
});
