"use client";

import { useEffect, type TransitionEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArtifactWorkspace } from '@/components/artifacts/ArtifactWorkspace';
import { ArtifactLibraryPanel } from '@/components/artifacts/ArtifactLibraryPanel';
import { DesktopSourcesPanel } from '@/components/chat/DesktopSourcesPanel';
import { useDeferredArtifactRender } from '@/hooks/artifacts/use-deferred-artifact-render';
import { motionTransitions } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePreparedEntrance } from '@/hooks/use-prepared-entrance';
import {
  ARTIFACT_WORKSPACE_WIDTH,
  COMPACT_WORKSPACE_WIDTH,
  getRightWorkspaceWidth,
  useRightWorkspace,
} from './RightWorkspaceContext';

const DOCUMENT_REVEAL_FALLBACK_MS = 480;

export function DesktopRightWorkspace() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const { state, closeWorkspace, openArtifactLibrary } = useRightWorkspace();
  const isOpen = state.type !== 'closed';
  const entranceReady = usePreparedEntrance(isOpen && !isMobile);
  const width = getRightWorkspaceWidth(state);
  const visibleWidth = isOpen && entranceReady ? width : '0px';
  const artifactId = state.type === 'artifact'
    ? state.artifactId
    : state.type === 'sources'
      ? state.returnArtifactId ?? null
      : null;
  const artifactIsVisible = state.type === 'artifact';
  const artifactIsMounted = Boolean(artifactId && !isMobile);
  const { isDocumentReady, revealDocument } = useDeferredArtifactRender(
    artifactId,
    artifactIsMounted,
  );
  const returnLibraryChatId = state.type === 'artifact'
    ? state.returnLibraryChatId
    : state.type === 'sources'
      ? state.returnArtifactLibraryChatId
      : undefined;
  const handleArtifactBack = returnLibraryChatId
    ? () => openArtifactLibrary(returnLibraryChatId)
    : undefined;

  useEffect(() => {
    if (!artifactIsVisible || !entranceReady || isDocumentReady) return;
    if (prefersReducedMotion) {
      revealDocument();
      return;
    }

    const fallback = window.setTimeout(revealDocument, DOCUMENT_REVEAL_FALLBACK_MS);
    return () => window.clearTimeout(fallback);
  }, [
    artifactIsVisible,
    entranceReady,
    isDocumentReady,
    prefersReducedMotion,
    revealDocument,
  ]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (
      event.currentTarget === event.target
      && event.propertyName === 'width'
      && state.type === 'artifact'
    ) {
      revealDocument();
    }
  };

  if (isMobile) return null;

  return (
    <aside
      className={cn(
        'hidden h-full shrink-0 overflow-hidden border-l border-zinc-200/70 bg-background transition-[width,opacity] motion-layout-transition motion-reduce:transition-none dark:border-white/[0.07] md:flex',
        isOpen && entranceReady ? 'opacity-100' : 'border-l-0 opacity-0',
      )}
      style={{ width: visibleWidth }}
      aria-hidden={!isOpen || !entranceReady}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="relative h-full w-full min-w-0 [contain:layout_paint]">
        <AnimatePresence initial={false} mode="sync">
          {artifactId && (
            <motion.div
              key={`artifact-${artifactId}`}
              className={cn(
                'absolute inset-y-0 right-0 z-0 h-full',
                artifactIsVisible ? 'pointer-events-auto' : 'pointer-events-none',
              )}
              style={{ width: ARTIFACT_WORKSPACE_WIDTH }}
              initial={{ opacity: 0 }}
              animate={{ opacity: artifactIsVisible ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={motionTransitions.contentSwap}
              aria-hidden={!artifactIsVisible}
              inert={!artifactIsVisible}
            >
              <ArtifactWorkspace
                artifactId={artifactId}
                isMobile={false}
                renderDocument={isDocumentReady}
                onClose={closeWorkspace}
                onBack={handleArtifactBack}
                returnLibraryChatId={returnLibraryChatId}
              />
            </motion.div>
          )}
          {state.type === 'sources' && (
            <motion.div
              key="sources"
              className="absolute inset-y-0 right-0 z-10 h-full"
              style={{ width: COMPACT_WORKSPACE_WIDTH }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={motionTransitions.contentSwap}
            >
              <DesktopSourcesPanel />
            </motion.div>
          )}
          {state.type === 'artifact-library' && (
            <motion.div
              key={`artifact-library-${state.chatId}`}
              className="absolute inset-y-0 right-0 z-10 h-full"
              style={{ width: COMPACT_WORKSPACE_WIDTH }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={motionTransitions.contentSwap}
            >
              <ArtifactLibraryPanel chatId={state.chatId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
