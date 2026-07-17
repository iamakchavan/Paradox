"use client";

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { ArtifactWorkspace } from '@/components/artifacts/ArtifactWorkspace';
import { useDeferredArtifactRender } from '@/hooks/artifacts/use-deferred-artifact-render';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileBackDismiss } from '@/hooks/use-mobile-back-dismiss';
import { usePreparedEntrance } from '@/hooks/use-prepared-entrance';
import { motionTransitions } from '@/lib/motion';
import { useRightWorkspace } from './RightWorkspaceContext';

export function MobileArtifactWorkspace() {
  const isMobile = useIsMobile();
  const { state, closeWorkspace, openArtifactLibrary } = useRightWorkspace();
  const isOpen = isMobile && state.type === 'artifact';
  const entranceReady = usePreparedEntrance(isOpen);
  const artifactId = state.type === 'artifact' ? state.artifactId : null;
  const { isDocumentReady, revealDocument } = useDeferredArtifactRender(artifactId, isOpen);
  const returnLibraryChatId = state.type === 'artifact' ? state.returnLibraryChatId : undefined;

  const { runAfterHistoryDismiss } = useMobileBackDismiss({
    isOpen,
    isMobile,
    stateKey: 'paradoxArtifactWorkspace',
    entryPrefix: 'artifact-workspace',
    onDismiss: () => {
      if (returnLibraryChatId) {
        openArtifactLibrary(returnLibraryChatId);
        return;
      }
      closeWorkspace();
    },
  });

  return (
    <AnimatePresence>
      {isOpen && artifactId && (
        <DialogPrimitive.Root open onOpenChange={open => { if (!open) closeWorkspace(); }}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Content asChild>
              <motion.div
                key={`artifact-workspace-${artifactId}`}
                initial="closed"
                animate={entranceReady ? 'open' : 'closed'}
                exit="closed"
                variants={{
                  open: { x: 0 },
                  closed: { x: '100%' },
                }}
                transition={motionTransitions.drawer}
                onAnimationComplete={definition => {
                  if (definition === 'open') revealDocument();
                }}
                className="fixed inset-0 z-[60] overflow-hidden bg-background outline-none [backface-visibility:hidden] [contain:layout_paint] will-change-transform md:hidden"
              >
                <DialogPrimitive.Title className="sr-only">Deep research report</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Read, copy, download, or inspect the sources for this report.
                </DialogPrimitive.Description>
                <ArtifactWorkspace
                  key={artifactId}
                  artifactId={artifactId}
                  isMobile
                  renderDocument={isDocumentReady}
                  onClose={closeWorkspace}
                  onBack={returnLibraryChatId
                    ? () => runAfterHistoryDismiss(() => openArtifactLibrary(returnLibraryChatId))
                    : undefined}
                  returnLibraryChatId={returnLibraryChatId}
                />
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}
