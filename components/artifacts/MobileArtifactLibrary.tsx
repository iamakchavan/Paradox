"use client";

import { X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ArtifactList } from './ArtifactList';
import { FloatingIconButton } from '@/components/ui/floating-icon-button';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';
import { useChatArtifacts } from '@/hooks/artifacts/use-chat-artifacts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileBackDismiss } from '@/hooks/use-mobile-back-dismiss';
import { useRightWorkspace } from '@/components/workspace/RightWorkspaceContext';

interface Props {
  activeChatId: string | null;
}

export function MobileArtifactLibrary({ activeChatId: routeChatId }: Props) {
  const isMobile = useIsMobile();
  const { state, openArtifact, closeWorkspace } = useRightWorkspace();
  const isOpen = isMobile && state.type === 'artifact-library';
  const activeChatId = isOpen && state.type === 'artifact-library' ? state.chatId : null;
  const [retainedChatId, setRetainedChatId] = useState<string | null>(null);
  // Keep only artifact metadata warm for the active chat. Report Markdown is
  // loaded separately when a user opens an artifact.
  const chatId = activeChatId ?? retainedChatId ?? routeChatId;
  const { artifacts, isLoading } = useChatArtifacts(chatId);
  const description = `${artifacts.length} ${artifacts.length === 1 ? 'artifact' : 'artifacts'} in this chat`;
  const { runAfterHistoryDismiss } = useMobileBackDismiss({
    isOpen,
    isMobile,
    stateKey: 'paradoxArtifactLibrary',
    entryPrefix: 'artifact-library',
    onDismiss: closeWorkspace,
  });
  const dismissSheet = useCallback(() => {
    runAfterHistoryDismiss(closeWorkspace);
  }, [closeWorkspace, runAfterHistoryDismiss]);

  useEffect(() => {
    if (activeChatId) setRetainedChatId(activeChatId);
  }, [activeChatId]);

  if (!chatId) return null;

  return (
    <MobileBottomSheet
      open={isOpen}
      onOpenChange={open => { if (!open) dismissSheet(); }}
      onExitComplete={() => {
        if (!isOpen) setRetainedChatId(null);
      }}
      title="Artifacts"
      description={description}
      className="h-[72dvh] min-h-[320px] [contain:layout_paint] md:hidden"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 progressive-blur-top"
        aria-hidden="true"
      />
      <header className="absolute inset-x-0 top-6 z-30 flex items-start gap-3 px-5 pb-3 pt-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">Artifacts</h2>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <FloatingIconButton onClick={dismissSheet} aria-label="Close artifacts">
          <X className="h-4 w-4" />
        </FloatingIconButton>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pb-5 pt-[78px] sidebar-scroll">
        <ArtifactList
          artifacts={artifacts}
          isLoading={isLoading}
          onSelect={artifactId => {
            runAfterHistoryDismiss(() => {
              openArtifact(artifactId, { returnLibraryChatId: chatId });
            });
          }}
        />
      </div>
    </MobileBottomSheet>
  );
}
