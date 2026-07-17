import type { ArtifactBundle } from './types';

const MAX_RUNTIME_ARTIFACTS = 12;
const EMPTY_CHAT_SNAPSHOT: ArtifactBundle[] = [];
const snapshots = new Map<string, ArtifactBundle>();
const listeners = new Map<string, Set<() => void>>();
const chatListeners = new Map<string, Set<() => void>>();
const chatSnapshots = new Map<string, ArtifactBundle[]>();

export function publishArtifactSnapshot(bundle: ArtifactBundle): void {
  const previous = snapshots.get(bundle.artifact.id);
  if (
    previous
    && previous.artifact.status === bundle.artifact.status
    && previous.artifact.title === bundle.artifact.title
    && previous.version.markdown === bundle.version.markdown
    && previous.version.sources === bundle.version.sources
  ) {
    return;
  }

  snapshots.delete(bundle.artifact.id);
  snapshots.set(bundle.artifact.id, bundle);
  trimRuntimeSnapshots();
  listeners.get(bundle.artifact.id)?.forEach(listener => listener());
  notifyChat(bundle.artifact.chatId);
  if (previous && previous.artifact.chatId !== bundle.artifact.chatId) {
    notifyChat(previous.artifact.chatId);
  }
}

export function getArtifactSnapshot(id: string): ArtifactBundle | null {
  return snapshots.get(id) ?? null;
}

export function subscribeToArtifact(id: string, listener: () => void): () => void {
  const artifactListeners = listeners.get(id) ?? new Set<() => void>();
  artifactListeners.add(listener);
  listeners.set(id, artifactListeners);

  return () => {
    artifactListeners.delete(listener);
    if (artifactListeners.size === 0) listeners.delete(id);
  };
}

export function getRuntimeArtifactsForChat(chatId: string): ArtifactBundle[] {
  return chatSnapshots.get(chatId) ?? EMPTY_CHAT_SNAPSHOT;
}

export function subscribeToArtifactChat(chatId: string, listener: () => void): () => void {
  const listenersForChat = chatListeners.get(chatId) ?? new Set<() => void>();
  listenersForChat.add(listener);
  chatListeners.set(chatId, listenersForChat);

  return () => {
    listenersForChat.delete(listener);
    if (listenersForChat.size === 0) chatListeners.delete(chatId);
  };
}

function trimRuntimeSnapshots(): void {
  while (snapshots.size > MAX_RUNTIME_ARTIFACTS) {
    const oldestId = snapshots.keys().next().value as string | undefined;
    if (!oldestId) return;
    const removed = snapshots.get(oldestId);
    snapshots.delete(oldestId);
    if (removed) notifyChat(removed.artifact.chatId);
  }
}

function notifyChat(chatId: string): void {
  const nextSnapshot = Array.from(snapshots.values())
    .filter(bundle => bundle.artifact.chatId === chatId);
  if (nextSnapshot.length > 0) {
    chatSnapshots.set(chatId, nextSnapshot);
  } else {
    chatSnapshots.delete(chatId);
  }
  chatListeners.get(chatId)?.forEach(listener => listener());
}
