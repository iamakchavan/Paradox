import { parseResearchStream } from '@/lib/research/parser';
import { normalizeSourceCollection } from '@/lib/research/source-normalization';
import {
  getDeepResearchArtifactId,
  getReportTitle,
  parseDeepResearchArtifact,
} from './deep-research';
import { createArtifactBundle } from './snapshot';
import type { ArtifactBundle, ArtifactSource, ArtifactStatus } from './types';

const SNAPSHOT_INTERVAL_MS = 96;

interface DeepResearchArtifactProjectorOptions {
  chatId: string;
  messageId: number;
  fallbackTitle: string;
}

interface ProjectOptions {
  force?: boolean;
  status?: ArtifactStatus;
}

export interface DeepResearchArtifactProjector {
  project: (content: string, options?: ProjectOptions) => ArtifactBundle | null;
  getCurrent: () => ArtifactBundle | null;
}

/**
 * Projects the report envelope embedded in a research stream into a bounded
 * document snapshot. The projector intentionally lives outside React so a
 * streaming report cannot add another render loop to the chat page.
 */
export function createDeepResearchArtifactProjector(
  options: DeepResearchArtifactProjectorOptions,
): DeepResearchArtifactProjector {
  const artifactId = getDeepResearchArtifactId(options.chatId, options.messageId);
  let sources: ArtifactSource[] | null = null;
  let current: ArtifactBundle | null = null;
  let lastProjectionAt = 0;

  const project = (content: string, projectOptions: ProjectOptions = {}) => {
    if (!content.includes('<artifact-report status="started" />')) return current;

    const now = Date.now();
    if (!projectOptions.force && now - lastProjectionAt < SNAPSHOT_INTERVAL_MS) {
      return current;
    }

    const parsed = parseDeepResearchArtifact(content);
    if (!parsed.artifact) return current;

    if (sources === null) {
      const parsedResearch = parseResearchStream(content);
      sources = normalizeSourceCollection(
        parsedResearch.steps.flatMap(step => step.results ?? []),
      );
    }

    const status = projectOptions.status ?? parsed.artifact.status;
    const markdown = parsed.artifact.markdown;
    const next = createArtifactBundle({
      id: artifactId,
      chatId: options.chatId,
      messageId: options.messageId,
      title: getReportTitle(markdown, options.fallbackTitle),
      status,
      markdown,
      sources,
      createdAt: current?.artifact.createdAt,
      updatedAt: now,
      revision: (current?.artifact.revision ?? 0) + 1,
    });

    current = next;
    lastProjectionAt = now;
    return next;
  };

  return {
    project,
    getCurrent: () => current,
  };
}
