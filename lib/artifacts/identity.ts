export function getArtifactVersionId(artifactId: string, version = 1): string {
  return `${artifactId}:v${version}`;
}

export function createArtifactId(): string {
  return crypto.randomUUID();
}
