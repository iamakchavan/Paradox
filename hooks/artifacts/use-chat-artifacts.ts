"use client";

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { artifactRepository } from '@/lib/artifacts/repository';
import {
  getRuntimeArtifactsForChat,
  subscribeToArtifactChat,
} from '@/lib/artifacts/runtime-store';
import type { ArtifactBundle, ArtifactRecord, ArtifactStatus } from '@/lib/artifacts/types';

const EMPTY_RUNTIME_ARTIFACTS: ArtifactBundle[] = [];

const STATUS_RANK: Record<ArtifactStatus, number> = {
  streaming: 0,
  failed: 1,
  complete: 2,
};

export function useChatArtifacts(chatId: string | null): {
  artifacts: ArtifactRecord[];
  isLoading: boolean;
} {
  const subscribe = useCallback(
    (listener: () => void) => chatId
      ? subscribeToArtifactChat(chatId, listener)
      : () => {},
    [chatId],
  );
  const getSnapshot = useCallback(
    () => getRuntimeArtifactsForChat(chatId ?? ''),
    [chatId],
  );
  const runtimeArtifacts = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => EMPTY_RUNTIME_ARTIFACTS,
  );
  const persistedArtifacts = useLiveQuery(
    () => chatId ? artifactRepository.listForChat(chatId) : Promise.resolve([]),
    [chatId],
  );

  const artifacts = useMemo(() => {
    if (!chatId) return [];
    const merged = new Map<string, ArtifactRecord>();
    for (const artifact of persistedArtifacts ?? []) merged.set(artifact.id, artifact);
    for (const bundle of runtimeArtifacts) {
      const existing = merged.get(bundle.artifact.id);
      merged.set(bundle.artifact.id, chooseFreshestRecord(existing, bundle.artifact));
    }

    return Array.from(merged.values())
      .filter(artifact => artifact.status !== 'failed' || artifact.hasContent === true)
      .sort((left, right) => right.createdAt - left.createdAt);
  }, [chatId, persistedArtifacts, runtimeArtifacts]);

  return {
    artifacts,
    isLoading: Boolean(chatId && persistedArtifacts === undefined && artifacts.length === 0),
  };
}

function chooseFreshestRecord(
  persisted: ArtifactRecord | undefined,
  runtime: ArtifactRecord,
): ArtifactRecord {
  if (!persisted) return runtime;
  if (STATUS_RANK[persisted.status] > STATUS_RANK[runtime.status]) return persisted;
  if (STATUS_RANK[runtime.status] > STATUS_RANK[persisted.status]) return runtime;
  return runtime.updatedAt >= persisted.updatedAt ? runtime : persisted;
}
