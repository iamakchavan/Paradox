"use client";

import { AlertCircle, FileText } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ArtifactRecord } from '@/lib/artifacts/types';

interface Props {
  artifacts: ArtifactRecord[];
  activeArtifactId?: string;
  isLoading?: boolean;
  onSelect: (artifactId: string) => void;
}

export function ArtifactList({ artifacts, activeArtifactId, isLoading = false, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-1 px-3 pb-4 pt-2" aria-label="Loading artifacts">
        {[0, 1, 2].map(item => (
          <div key={item} className="flex items-start gap-3 rounded-lg px-3 py-3.5">
            <div className="mt-0.5 h-5 w-5 shrink-0 animate-pulse rounded bg-foreground/[0.055] motion-reduce:animate-none" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-4/5 animate-pulse rounded bg-foreground/[0.055] motion-reduce:animate-none" />
              <div className="h-2.5 w-2/5 animate-pulse rounded bg-foreground/[0.035] motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center px-8 py-10 text-center">
        <FileText className="h-5 w-5 text-foreground/35" aria-hidden="true" />
        <p className="mt-3 text-[13px] font-medium text-foreground/75">No artifacts yet</p>
        <p className="mt-1 max-w-52 text-[11px] leading-4 text-muted-foreground">
          Documents and research reports created in this chat will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 px-3 pb-4 pt-2">
      {artifacts.map(artifact => {
        const isStreaming = artifact.status === 'streaming';
        const isPartial = artifact.status === 'failed';
        const isResearchReport = artifact.kind === 'deep-research-report';
        const artifactLabel = isResearchReport ? 'Research report' : 'Document';

        return (
          <button
            key={artifact.id}
            type="button"
            onClick={() => onSelect(artifact.id)}
            className={cn(
              'group flex w-full min-w-0 items-start gap-3 rounded-lg border border-transparent px-3 py-3.5 text-left transition-[background-color,border-color] duration-150 hover:border-foreground/[0.055] hover:bg-foreground/[0.025] active:bg-foreground/[0.045]',
              activeArtifactId === artifact.id && 'border-foreground/[0.065] bg-foreground/[0.04]',
            )}
            aria-current={activeArtifactId === artifact.id ? 'true' : undefined}
          >
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-foreground/50">
              {isStreaming ? (
                <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden="true">
                  <span className="absolute h-3 w-3 animate-ping rounded-full bg-foreground/20 motion-reduce:animate-none" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-foreground/65" />
                </span>
              ) : isPartial ? (
                <AlertCircle className="h-[17px] w-[17px]" />
              ) : (
                <FileText className="h-[17px] w-[17px]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13px] font-medium leading-[1.4] text-foreground/90">
                {artifact.title}
              </p>
              <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>
                  {isStreaming ? 'Writing' : isPartial ? `Partial ${artifactLabel.toLowerCase()}` : artifactLabel}
                </span>
                <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-current opacity-55" aria-hidden="true" />
                <time className="truncate" dateTime={new Date(artifact.createdAt).toISOString()}>
                  {formatDistanceToNowStrict(artifact.createdAt, { addSuffix: true })}
                </time>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
