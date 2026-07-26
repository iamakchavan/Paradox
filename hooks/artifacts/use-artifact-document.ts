"use client";

import { useCallback, useSyncExternalStore } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { artifactRepository } from '@/lib/artifacts/repository';
import {
  getArtifactSnapshot,
  subscribeToArtifact,
} from '@/lib/artifacts/runtime-store';
import type { ArtifactBundle } from '@/lib/artifacts/types';

const EMPTY_SNAPSHOT: ArtifactBundle | null = null;

export function useArtifactDocument(artifactId: string | null): {
  bundle: ArtifactBundle | null;
  isLoading: boolean;
} {
  const subscribe = useCallback(
    (listener: () => void) => artifactId
      ? subscribeToArtifact(artifactId, listener)
      : () => {},
    [artifactId],
  );
  const getSnapshot = useCallback(
    () => artifactId ? getArtifactSnapshot(artifactId) : EMPTY_SNAPSHOT,
    [artifactId],
  );
  const runtimeBundle = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT);
  const persistedBundle = useLiveQuery(
    () => artifactId ? artifactRepository.get(artifactId) : Promise.resolve(null),
    [artifactId],
  );

  const bundle = chooseFreshestBundle(runtimeBundle, persistedBundle ?? null);
  return {
    bundle,
    isLoading: Boolean(artifactId && persistedBundle === undefined && !runtimeBundle),
  };
}

function chooseFreshestBundle(
  runtimeBundle: ArtifactBundle | null,
  persistedBundle: ArtifactBundle | null,
): ArtifactBundle | null {
  if (!runtimeBundle) return persistedBundle;
  if (!persistedBundle) return runtimeBundle;
  if (persistedBundle.artifact.status === 'complete' && runtimeBundle.artifact.status !== 'complete') {
    return persistedBundle;
  }
  return runtimeBundle.artifact.updatedAt >= persistedBundle.artifact.updatedAt
    ? runtimeBundle
    : persistedBundle;
}

