"use client";

import { useCallback, useState } from 'react';
import { ArrowLeft, Check, Copy, Download, FileSearch, X } from 'lucide-react';
import { useArtifactDocument } from '@/hooks/artifacts/use-artifact-document';
import { useMobileBackDismiss } from '@/hooks/use-mobile-back-dismiss';
import { downloadMarkdown } from '@/lib/artifacts/markdown-download';
import { artifactRendererRegistry } from './registry';
import { ArtifactErrorBoundary } from './ArtifactErrorBoundary';
import { FloatingIconButton } from '@/components/ui/floating-icon-button';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';
import { SourceList } from '@/components/chat/SourceList';
import { SourcesSheetHeader } from '@/components/chat/SourcesSheetHeader';
import { useRightWorkspaceActions } from '@/components/workspace/RightWorkspaceContext';
import { ArtifactLoadingState } from './ArtifactLoadingState';
import { ArtifactTitlePill } from './ArtifactTitlePill';

interface Props {
  artifactId: string;
  isMobile: boolean;
  onClose: () => void;
  onBack?: () => void;
  returnLibraryChatId?: string;
  renderDocument?: boolean;
}

export function ArtifactWorkspace({
  artifactId,
  isMobile,
  onClose,
  onBack,
  returnLibraryChatId,
  renderDocument = true,
}: Props) {
  const { bundle, isLoading } = useArtifactDocument(artifactId);
  const { openSources } = useRightWorkspaceActions();
  const [copied, setCopied] = useState(false);
  const [isMobileSourcesOpen, setIsMobileSourcesOpen] = useState(false);

  const { runAfterHistoryDismiss } = useMobileBackDismiss({
    isOpen: isMobileSourcesOpen,
    isMobile,
    stateKey: 'paradoxArtifactSources',
    entryPrefix: 'artifact-sources',
    onDismiss: () => setIsMobileSourcesOpen(false),
  });
  const dismissMobileSources = useCallback(() => {
    runAfterHistoryDismiss(() => setIsMobileSourcesOpen(false));
  }, [runAfterHistoryDismiss]);

  const copyDocument = useCallback(async () => {
    if (!bundle?.version.markdown) return;
    await navigator.clipboard.writeText(bundle.version.markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }, [bundle]);

  if (isLoading || !bundle) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="h-[68px] shrink-0 border-b border-foreground/[0.06]" />
        <ArtifactLoadingState className="min-h-0 flex-1 pb-[68px]" />
      </div>
    );
  }

  const Renderer = artifactRendererRegistry[bundle.artifact.kind];
  const isResearchReport = bundle.artifact.kind === 'deep-research-report';
  const documentLabel = isResearchReport ? 'report' : 'document';
  const sourceDescription = `${bundle.version.sources.length} ${bundle.version.sources.length === 1 ? 'source' : 'sources'} checked for this ${documentLabel}`;

  const showSources = () => {
    if (isMobile) {
      setIsMobileSourcesOpen(true);
      return;
    }
    openSources(bundle.version.sources, {
      returnArtifactId: artifactId,
      returnArtifactLibraryChatId: returnLibraryChatId,
    });
  };

  return (
    <div className="relative flex h-full min-w-0 flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 progressive-blur-top" aria-hidden="true" />
      <header className="absolute inset-x-0 top-0 z-30 flex h-[68px] items-center gap-2 px-4 sm:px-5">
        {onBack && (
          <FloatingIconButton onClick={onBack} aria-label="Back to artifacts" className="h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </FloatingIconButton>
        )}
        <div className="min-w-0 flex-1">
          <ArtifactTitlePill
            title={bundle.artifact.title}
            status={bundle.artifact.status}
            isMobile={isMobile}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {bundle.version.sources.length > 0 && (
            <button
              type="button"
              onClick={showSources}
              className="liquid-glass-dock inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-medium tabular-nums text-foreground/60 transition-[background-color,color,transform] duration-150 hover:bg-foreground/[0.055] hover:text-foreground active:scale-[0.96] motion-reduce:transform-none"
              aria-label={`View ${sourceDescription}`}
              title={`View ${documentLabel} sources`}
            >
              <FileSearch className="h-4 w-4" />
              <span className="min-w-3 text-center leading-none">{bundle.version.sources.length}</span>
            </button>
          )}
          <div className="liquid-glass-dock inline-flex h-10 shrink-0 items-center overflow-hidden rounded-full">
            <button
              type="button"
              onClick={copyDocument}
              aria-label={`Copy ${documentLabel}`}
              title={`Copy ${documentLabel}`}
              className="inline-flex h-10 w-10 items-center justify-center text-foreground/60 transition-[background-color,color,transform] duration-150 hover:bg-foreground/[0.055] hover:text-foreground active:scale-[0.92] motion-reduce:transform-none"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
            <span className="h-4 w-px shrink-0 bg-foreground/[0.09]" aria-hidden="true" />
            <button
              type="button"
              onClick={() => downloadMarkdown(bundle.artifact.title, bundle.version.markdown)}
              aria-label={`Download ${documentLabel} as Markdown`}
              title="Download Markdown"
              className="inline-flex h-10 w-10 items-center justify-center text-foreground/60 transition-[background-color,color,transform] duration-150 hover:bg-foreground/[0.055] hover:text-foreground active:scale-[0.92] motion-reduce:transform-none"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
          <FloatingIconButton onClick={onClose} aria-label={`Close ${documentLabel}`} className="h-10 w-10">
            <X className="h-4 w-4" />
          </FloatingIconButton>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pt-[68px] chat-scrollbar">
        {renderDocument ? (
          <div className="animate-in fade-in-0 duration-200 motion-reduce:animate-none">
            <ArtifactErrorBoundary>
              <Renderer
                markdown={bundle.version.markdown}
                sources={bundle.version.sources}
                isStreaming={bundle.artifact.status === 'streaming'}
              />
            </ArtifactErrorBoundary>
          </div>
        ) : (
          <ArtifactLoadingState
            className="h-full min-h-[240px]"
            label={isResearchReport ? 'Preparing report' : 'Preparing document'}
          />
        )}
      </div>

      {isMobile && (
        <MobileBottomSheet
          open={isMobileSourcesOpen}
          onOpenChange={open => { if (!open) dismissMobileSources(); }}
          title="Sources"
          description={sourceDescription}
          className="h-[82dvh] min-h-[320px] md:hidden"
        >
          <SourcesSheetHeader
            description={sourceDescription}
            onClose={dismissMobileSources}
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-[72px] sidebar-scroll">
            <SourceList sources={bundle.version.sources} />
          </div>
        </MobileBottomSheet>
      )}
    </div>
  );
}
