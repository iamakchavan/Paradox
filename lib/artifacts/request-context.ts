import { parseArtifactReferences } from './reference';
import { artifactRepository } from './repository';

export interface ArtifactRequestDocument {
  id: string;
  title: string;
  markdown: string;
  revision: number;
  truncated: boolean;
}

interface ArtifactMessageLike {
  content?: unknown;
}

const MAX_ARTIFACT_LOOKUPS = 12;
const MAX_CONTEXT_DOCUMENTS = 3;
const MAX_DOCUMENT_CHARS = 16_000;
const MAX_CONTEXT_CHARS = 40_000;

function collectRecentArtifactIds(messages: readonly ArtifactMessageLike[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const content = messages[index]?.content;
    if (typeof content !== 'string') continue;

    const references = parseArtifactReferences(content).artifactIds;
    for (let referenceIndex = references.length - 1; referenceIndex >= 0; referenceIndex -= 1) {
      const id = references[referenceIndex];
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
      if (ids.length >= MAX_ARTIFACT_LOOKUPS) return ids;
    }
  }

  return ids;
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLocaleLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(token => token.length >= 3),
  );
}

function titleRelevance(title: string, promptTokens: ReadonlySet<string>): number {
  let score = 0;
  for (const token of Array.from(tokenize(title))) {
    if (promptTokens.has(token)) score += 1;
  }
  return score;
}

/**
 * Resolves only the small set of completed local documents needed for the next
 * request. Artifact bodies stay out of chat rows and React state.
 */
export async function buildArtifactRequestContext(
  messages: readonly ArtifactMessageLike[],
  latestUserContent: string,
): Promise<ArtifactRequestDocument[]> {
  const artifactIds = collectRecentArtifactIds(messages);
  if (artifactIds.length === 0) return [];

  const bundles = await Promise.all(artifactIds.map(id => artifactRepository.get(id)));
  const promptTokens = tokenize(latestUserContent);
  const candidates = bundles
    .map((bundle, recency) => ({ bundle, recency }))
    .filter(({ bundle }) => (
      (bundle?.artifact.kind === 'markdown-document'
        || bundle?.artifact.kind === 'deep-research-report')
      && bundle.artifact.status === 'complete'
      && bundle.version.markdown.trim().length > 0
    ))
    .map(({ bundle, recency }) => ({
      bundle: bundle!,
      recency,
      relevance: titleRelevance(bundle!.artifact.title, promptTokens),
    }))
    .sort((left, right) => (
      right.relevance - left.relevance || left.recency - right.recency
    ));

  const context: ArtifactRequestDocument[] = [];
  let remainingChars = MAX_CONTEXT_CHARS;

  for (const { bundle } of candidates) {
    if (context.length >= MAX_CONTEXT_DOCUMENTS || remainingChars <= 0) break;
    const markdown = bundle.version.markdown.trim();
    const allowedChars = Math.min(MAX_DOCUMENT_CHARS, remainingChars);
    const truncated = markdown.length > allowedChars;
    const selectedMarkdown = truncated
      ? `${markdown.slice(0, allowedChars).trimEnd()}\n\n[Artifact truncated for request context]`
      : markdown;

    context.push({
      id: bundle.artifact.id,
      title: bundle.artifact.title,
      markdown: selectedMarkdown,
      revision: bundle.artifact.revision,
      truncated,
    });
    remainingChars -= selectedMarkdown.length;
  }

  return context;
}
