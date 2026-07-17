"use client";

import { useLayoutEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { motionTransitions } from '@/lib/motion';
import { FloatingIconButton } from '@/components/ui/floating-icon-button';
import { SourceList, type AnswerSource } from './SourceList';
import { useRightWorkspace } from '@/components/workspace/RightWorkspaceContext';

const EMPTY_SOURCES: AnswerSource[] = [];

export function DesktopSourcesPanel() {
  const { state, closeSources } = useRightWorkspace();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sources = state.type === 'sources' ? state.sources : EMPTY_SOURCES;
  const returnsToArtifact = state.type === 'sources' && Boolean(state.returnArtifactId);
  const sourceSetKey = useMemo(
    () => sources.map(source => source.url).join('\u0000'),
    [sources],
  );
  const title = `${sources.length} ${sources.length === 1 ? 'source' : 'sources'}`;

  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [sourceSetKey]);

  return (
    <div className="progressive-blur-panel-surface relative flex h-full min-w-0 flex-col bg-background dark:bg-[hsl(var(--surface-panel))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 progressive-blur-top" aria-hidden="true" />
      <header className="absolute inset-x-0 top-0 z-30 flex h-[72px] items-center justify-between gap-4 px-5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-foreground">Sources</h2>
          <div className="mt-0.5 grid">
            <AnimatePresence initial={false} mode="sync">
              <motion.p
                key={sourceSetKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={motionTransitions.contentSwap}
                className="col-start-1 row-start-1 text-xs text-muted-foreground"
              >
                {title} checked for this {returnsToArtifact ? 'report' : 'answer'}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <FloatingIconButton
          onClick={closeSources}
          aria-label={returnsToArtifact ? 'Back to report' : 'Close sources'}
        >
          {returnsToArtifact ? <ArrowLeft className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </FloatingIconButton>
      </header>

      <div
        ref={scrollContainerRef}
        className="relative min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pb-16 pt-[72px] sidebar-scroll"
      >
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={sourceSetKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={motionTransitions.contentSwap}
              className="col-start-1 row-start-1 min-w-0 overflow-hidden"
            >
              <SourceList sources={sources} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 progressive-blur" aria-hidden="true" />
    </div>
  );
}
