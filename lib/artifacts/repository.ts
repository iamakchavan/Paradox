import { db } from '@/lib/db';
import {
  getDeepResearchArtifactId,
  getDeepResearchVersionId,
} from './deep-research';
import type {
  ArtifactBundle,
  ArtifactRecord,
  ArtifactRepository,
  ArtifactStatus,
  ArtifactVersionRecord,
  UpsertArtifactDraftInput,
} from './types';

const STATUS_RANK: Record<ArtifactStatus, number> = {
  streaming: 0,
  failed: 1,
  complete: 2,
};

class IndexedDbArtifactRepository implements ArtifactRepository {
  async get(id: string): Promise<ArtifactBundle | null> {
    const artifact = await db.artifacts.get(id);
    if (!artifact) return null;
    const version = await db.artifactVersions.get(artifact.currentVersionId);
    return version ? { artifact, version } : null;
  }

  async listForChat(chatId: string): Promise<ArtifactRecord[]> {
    const artifacts = await db.artifacts.where('chatId').equals(chatId).toArray();
    return artifacts.sort((left, right) => right.createdAt - left.createdAt);
  }

  async upsertDraft(input: UpsertArtifactDraftInput): Promise<ArtifactBundle> {
    return db.transaction('rw', db.artifacts, db.artifactVersions, async () => {
      const now = input.now ?? Date.now();
      const existing = await db.artifacts.get(input.id);
      const versionId = existing?.currentVersionId ?? getDeepResearchVersionId(input.id);
      const preventsRegression = Boolean(
        existing && STATUS_RANK[existing.status] > STATUS_RANK[input.status],
      );
      const status = preventsRegression && existing
        ? existing.status
        : input.status;
      const existingVersion = await db.artifactVersions.get(versionId);
      const hasContent = preventsRegression && existingVersion
        ? existingVersion.markdown.trim().length > 0
        : input.markdown.trim().length > 0 || existing?.hasContent === true;
      const artifact: ArtifactRecord = {
        id: input.id,
        chatId: input.chatId,
        messageId: input.messageId,
        kind: 'deep-research-report',
        title: preventsRegression
          ? existing?.title ?? input.title
          : input.title || existing?.title || 'Deep Research Report',
        status,
        currentVersionId: versionId,
        revision: (existing?.revision ?? 0) + 1,
        syncStatus: 'local',
        hasContent,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      const version: ArtifactVersionRecord = {
        id: versionId,
        artifactId: input.id,
        version: 1,
        markdown: preventsRegression && existingVersion
          ? existingVersion.markdown
          : input.markdown,
        sources: preventsRegression && existingVersion
          ? existingVersion.sources
          : input.sources,
        createdAt: existingVersion?.createdAt ?? now,
        updatedAt: now,
      };

      await db.artifacts.put(artifact);
      await db.artifactVersions.put(version);
      return { artifact, version };
    });
  }

  async deleteForChat(chatId: string): Promise<void> {
    await db.transaction('rw', db.artifacts, db.artifactVersions, async () => {
      const artifacts = await db.artifacts.where('chatId').equals(chatId).toArray();
      if (artifacts.length === 0) return;
      const artifactIds = artifacts.map(artifact => artifact.id);
      await db.artifactVersions.where('artifactId').anyOf(artifactIds).delete();
      await db.artifacts.bulkDelete(artifactIds);
    });
  }

  async cloneForBranch(
    sourceChatId: string,
    targetChatId: string,
    messageIdMap: ReadonlyMap<number, number>,
  ): Promise<void> {
    const sourceArtifacts = await db.artifacts.where('chatId').equals(sourceChatId).toArray();
    const relevantArtifacts = sourceArtifacts.filter(artifact => messageIdMap.has(artifact.messageId));
    if (relevantArtifacts.length === 0) return;

    await db.transaction('rw', db.artifacts, db.artifactVersions, async () => {
      for (const sourceArtifact of relevantArtifacts) {
        const targetMessageId = messageIdMap.get(sourceArtifact.messageId);
        if (targetMessageId === undefined) continue;
        const sourceVersion = await db.artifactVersions.get(sourceArtifact.currentVersionId);
        if (!sourceVersion) continue;

        const artifactId = getDeepResearchArtifactId(targetChatId, targetMessageId);
        const versionId = getDeepResearchVersionId(artifactId, sourceVersion.version);
        const now = Date.now();
        await db.artifacts.put({
          ...sourceArtifact,
          id: artifactId,
          chatId: targetChatId,
          messageId: targetMessageId,
          currentVersionId: versionId,
          revision: 1,
          syncStatus: 'local',
          createdAt: now,
          updatedAt: now,
        });
        await db.artifactVersions.put({
          ...sourceVersion,
          id: versionId,
          artifactId,
          createdAt: now,
          updatedAt: now,
        });
      }
    });
  }
}

export const artifactRepository: ArtifactRepository = new IndexedDbArtifactRepository();
