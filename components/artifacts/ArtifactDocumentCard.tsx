"use client";

import { memo, useCallback } from 'react';
import { AlertCircle, ArrowUpRight, FileText } from 'lucide-react';
import { useArtifactDocument } from '@/hooks/artifacts/use-artifact-document';
import { useRightWorkspaceActions } from '@/components/workspace/RightWorkspaceContext';
import { DotmSquare15 } from '@/components/ui/dotm-square-15';

interface Props {
  artifactId: string;
}

export const ArtifactDocumentCard = memo(function ArtifactDocumentCard({ artifactId }: Props) {
  const { bundle, isLoading } = useArtifactDocument(artifactId);
  const { openArtifact } = useRightWorkspaceActions();
  const openDocument = useCallback(() => openArtifact(artifactId), [artifactId, openArtifact]);

  const isStreaming = isLoading || bundle?.artifact.status === 'streaming';
  const isUnavailable = !isLoading && (!bundle || (
    bundle.artifact.status === 'failed' && !bundle.version.markdown.trim()
  ));
  const title = bundle?.artifact.title || 'Preparing document';
  const statusLabel = isUnavailable
    ? 'Document could not be completed'
    : isStreaming
      ? 'Writing document'
      : bundle?.artifact.status === 'failed'
        ? 'Partial document'
        : 'Document';

  return (
    <button
      type="button"
      onClick={openDocument}
      disabled={isUnavailable}
      className="group my-5 flex w-full min-w-0 items-center gap-3 rounded-lg border border-foreground/[0.09] bg-foreground/[0.018] px-4 py-3.5 text-left transition-colors hover:bg-foreground/[0.035] active:bg-foreground/[0.05] disabled:cursor-default disabled:opacity-65 disabled:hover:bg-foreground/[0.018] dark:bg-white/[0.025] dark:hover:bg-white/[0.045] dark:disabled:hover:bg-white/[0.025]"
      aria-label={`${isStreaming ? 'Open document while it is being written' : 'Open document'}: ${title}`}
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
            ariaLabel="Writing artifact document"
            className="text-zinc-600/90 dark:text-zinc-300/90"
          />
        ) : isUnavailable ? (
          <AlertCircle className="h-[18px] w-[18px]" />
        ) : (
          <FileText className="h-[18px] w-[18px]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground/90">{title}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{statusLabel}</p>
      </div>
      {!isUnavailable && (
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/55 transition-colors group-hover:text-foreground/75" />
      )}
    </button>
  );
});
