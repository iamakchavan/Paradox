import { artifactRepository } from './repository';
import { publishArtifactSnapshot } from './runtime-store';
import { createArtifactBundle } from './snapshot';
import type { ArtifactStreamEvent } from './stream';
import type { ArtifactBundle, ArtifactStatus } from './types';

const PERSIST_INTERVAL_MS = 1500;

interface ArtifactProjectionState {
  artifactId: string;
  title: string;
  markdown: string;
  status: ArtifactStatus;
  createdAt: number;
  updatedAt: number;
  lastPersistedAt: number;
}

interface CreateArtifactStreamProjectorOptions {
  chatId: string;
  messageId: number;
}

export interface ArtifactStreamProjector {
  handle: (event: ArtifactStreamEvent) => void;
  settle: (status?: Extract<ArtifactStatus, 'failed'>) => Promise<void>;
}

export function createArtifactStreamProjector({
  chatId,
  messageId,
}: CreateArtifactStreamProjectorOptions): ArtifactStreamProjector {
  const states = new Map<string, ArtifactProjectionState>();
  const dirtyArtifactIds = new Set<string>();
  let publishFrame: number | null = null;
  let persistenceQueue = Promise.resolve();

  const toBundle = (state: ArtifactProjectionState): ArtifactBundle => createArtifactBundle({
    id: state.artifactId,
    chatId,
    messageId,
    kind: 'markdown-document',
    title: state.title,
    status: state.status,
    markdown: state.markdown,
    sources: [],
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  });

  const publish = (state: ArtifactProjectionState) => {
    dirtyArtifactIds.delete(state.artifactId);
    publishArtifactSnapshot(toBundle(state));
  };

  const flushPublishedSnapshots = () => {
    publishFrame = null;
    dirtyArtifactIds.forEach(artifactId => {
      const state = states.get(artifactId);
      if (state) publish(state);
    });
    dirtyArtifactIds.clear();
  };

  const schedulePublish = (state: ArtifactProjectionState) => {
    dirtyArtifactIds.add(state.artifactId);
    if (publishFrame !== null) return;
    publishFrame = requestAnimationFrame(flushPublishedSnapshots);
  };

  const persist = (state: ArtifactProjectionState) => {
    state.lastPersistedAt = state.updatedAt;
    const input = {
      id: state.artifactId,
      chatId,
      messageId,
      kind: 'markdown-document' as const,
      title: state.title,
      status: state.status,
      markdown: state.markdown,
      sources: [],
      now: state.updatedAt,
    };

    persistenceQueue = persistenceQueue
      .catch(() => undefined)
      .then(async () => {
        const persisted = await artifactRepository.upsertDraft(input);
        publishArtifactSnapshot(persisted);
      })
      .catch(error => {
        console.warn('[Artifact Stream] Failed to checkpoint document:', error);
      });
  };

  const flushTerminalState = (state: ArtifactProjectionState) => {
    if (publishFrame !== null) {
      cancelAnimationFrame(publishFrame);
      publishFrame = null;
    }
    dirtyArtifactIds.delete(state.artifactId);
    flushPublishedSnapshots();
    publish(state);
    persist(state);
  };

  const handle = (event: ArtifactStreamEvent) => {
    const now = Date.now();

    if (event.type === 'start') {
      const state: ArtifactProjectionState = {
        artifactId: event.artifactId,
        title: event.title,
        markdown: '',
        status: 'streaming',
        createdAt: now,
        updatedAt: now,
        lastPersistedAt: now,
      };
      states.set(event.artifactId, state);
      publish(state);
      persist(state);
      return;
    }

    const state = states.get(event.artifactId);
    if (!state) return;

    if (event.type === 'delta') {
      state.markdown += event.delta;
      state.updatedAt = now;
      schedulePublish(state);
      if (now - state.lastPersistedAt >= PERSIST_INTERVAL_MS) persist(state);
      return;
    }

    state.status = event.type === 'complete' ? 'complete' : 'failed';
    state.updatedAt = now;
    flushTerminalState(state);
  };

  const settle = async (status: Extract<ArtifactStatus, 'failed'> = 'failed') => {
    states.forEach(state => {
      if (state.status === 'streaming') {
        state.status = status;
        state.updatedAt = Date.now();
        flushTerminalState(state);
      }
    });
    if (publishFrame !== null) {
      cancelAnimationFrame(publishFrame);
      publishFrame = null;
    }
    flushPublishedSnapshots();
    await persistenceQueue;
  };

  return { handle, settle };
}
