const ARTIFACT_REFERENCE_PATTERN = /<artifact-ref\s+id="([^"]+)"\s*\/>/g;

export function serializeArtifactReference(artifactId: string): string {
  return `<artifact-ref id="${artifactId}" />`;
}

export function parseArtifactReferences(content: string): {
  artifactIds: string[];
  cleanContent: string;
} {
  const artifactIds = Array.from(content.matchAll(ARTIFACT_REFERENCE_PATTERN), match => match[1]);

  return {
    artifactIds: Array.from(new Set(artifactIds)),
    cleanContent: content.replace(ARTIFACT_REFERENCE_PATTERN, '').trim(),
  };
}

export function ensureArtifactReferences(
  content: string,
  artifactIds: Iterable<string>,
): string {
  const existingIds = new Set(
    Array.from(content.matchAll(ARTIFACT_REFERENCE_PATTERN), match => match[1]),
  );
  let nextContent = content;

  for (const artifactId of Array.from(artifactIds)) {
    if (!artifactId || existingIds.has(artifactId)) continue;
    nextContent += serializeArtifactReference(artifactId);
    existingIds.add(artifactId);
  }

  return nextContent;
}

export function remapArtifactReferences(
  content: string,
  artifactIdMap: ReadonlyMap<string, string>,
): string {
  return content.replace(ARTIFACT_REFERENCE_PATTERN, (reference, artifactId: string) => {
    const targetId = artifactIdMap.get(artifactId);
    return targetId ? serializeArtifactReference(targetId) : reference;
  });
}
