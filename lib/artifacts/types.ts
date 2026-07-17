export type ArtifactKind = 'deep-research-report';

export type ArtifactStatus = 'streaming' | 'complete' | 'failed';

export type ArtifactSyncStatus = 'local' | 'pending' | 'synced' | 'conflict';

export interface ArtifactSource {
  title: string;
  url: string;
  content: string;
}

export interface ArtifactRecord {
  id: string;
  chatId: string;
  messageId: number;
  kind: ArtifactKind;
  title: string;
  status: ArtifactStatus;
  currentVersionId: string;
  revision: number;
  syncStatus: ArtifactSyncStatus;
  hasContent?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ArtifactVersionRecord {
  id: string;
  artifactId: string;
  version: number;
  markdown: string;
  sources: ArtifactSource[];
  createdAt: number;
  updatedAt: number;
}

export interface ArtifactBundle {
  artifact: ArtifactRecord;
  version: ArtifactVersionRecord;
}

export interface UpsertArtifactDraftInput {
  id: string;
  chatId: string;
  messageId: number;
  title: string;
  status: ArtifactStatus;
  markdown: string;
  sources: ArtifactSource[];
  now?: number;
}

export interface ArtifactRepository {
  get(id: string): Promise<ArtifactBundle | null>;
  listForChat(chatId: string): Promise<ArtifactRecord[]>;
  upsertDraft(input: UpsertArtifactDraftInput): Promise<ArtifactBundle>;
  deleteForChat(chatId: string): Promise<void>;
  cloneForBranch(
    sourceChatId: string,
    targetChatId: string,
    messageIdMap: ReadonlyMap<number, number>,
  ): Promise<void>;
}
