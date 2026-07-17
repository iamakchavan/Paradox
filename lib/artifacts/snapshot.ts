import { getDeepResearchVersionId } from './deep-research';
import type {
  ArtifactBundle,
  ArtifactSource,
  ArtifactStatus,
} from './types';

interface CreateArtifactBundleInput {
  id: string;
  chatId: string;
  messageId: number;
  title: string;
  status: ArtifactStatus;
  markdown: string;
  sources: ArtifactSource[];
  createdAt?: number;
  updatedAt?: number;
  revision?: number;
}

export function createArtifactBundle(input: CreateArtifactBundleInput): ArtifactBundle {
  const now = input.updatedAt ?? Date.now();
  const createdAt = input.createdAt ?? now;
  const versionId = getDeepResearchVersionId(input.id);

  return {
    artifact: {
      id: input.id,
      chatId: input.chatId,
      messageId: input.messageId,
      kind: 'deep-research-report',
      title: input.title,
      status: input.status,
      currentVersionId: versionId,
      revision: input.revision ?? 0,
      syncStatus: 'local',
      hasContent: input.markdown.trim().length > 0,
      createdAt,
      updatedAt: now,
    },
    version: {
      id: versionId,
      artifactId: input.id,
      version: 1,
      markdown: input.markdown,
      sources: input.sources,
      createdAt,
      updatedAt: now,
    },
  };
}
