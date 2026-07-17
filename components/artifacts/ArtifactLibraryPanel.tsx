"use client";

import { X } from 'lucide-react';
import { useChatArtifacts } from '@/hooks/artifacts/use-chat-artifacts';
import { FloatingIconButton } from '@/components/ui/floating-icon-button';
import { ArtifactList } from './ArtifactList';
import { useRightWorkspaceActions } from '@/components/workspace/RightWorkspaceContext';

interface Props {
  chatId: string;
}

export function ArtifactLibraryPanel({ chatId }: Props) {
  const { artifacts, isLoading } = useChatArtifacts(chatId);
  const { openArtifact, closeWorkspace } = useRightWorkspaceActions();
  const description = `${artifacts.length} ${artifacts.length === 1 ? 'artifact' : 'artifacts'} in this chat`;

  return (
    <div className="relative flex h-full min-w-0 flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 progressive-blur-top" aria-hidden="true" />
      <header className="absolute inset-x-0 top-0 z-30 flex h-[72px] items-center gap-3 px-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-foreground">Artifacts</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <FloatingIconButton onClick={closeWorkspace} aria-label="Close artifacts" className="h-8 w-8">
          <X className="h-4 w-4" />
        </FloatingIconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-12 pt-[72px] chat-scrollbar">
        <ArtifactList
          artifacts={artifacts}
          isLoading={isLoading}
          onSelect={artifactId => openArtifact(artifactId, { returnLibraryChatId: chatId })}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 progressive-blur" aria-hidden="true" />
    </div>
  );
}
