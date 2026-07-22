import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ensureArtifactReferences,
  parseArtifactReferences,
  remapArtifactReferences,
  serializeArtifactReference,
} from './reference.ts';

test('idempotently ensures references reported by the artifact event stream', () => {
  const existing = serializeArtifactReference('artifact-1');
  const content = ensureArtifactReferences(`Creating your document.${existing}`, [
    'artifact-1',
    'artifact-2',
    'artifact-2',
  ]);

  const parsed = parseArtifactReferences(content);
  assert.deepEqual(parsed.artifactIds, ['artifact-1', 'artifact-2']);
  assert.equal(parsed.cleanContent, 'Creating your document.');
});

test('extracts unique artifact references and removes markers from visible content', () => {
  const first = serializeArtifactReference('artifact-1');
  const second = serializeArtifactReference('artifact-2');
  const parsed = parseArtifactReferences(`Here is the document.\n${first}${second}${first}`);

  assert.deepEqual(parsed.artifactIds, ['artifact-1', 'artifact-2']);
  assert.equal(parsed.cleanContent, 'Here is the document.');
});

test('remaps artifact references while preserving unrelated markers', () => {
  const content = [
    serializeArtifactReference('artifact-1'),
    serializeArtifactReference('artifact-2'),
  ].join('');
  const remapped = remapArtifactReferences(content, new Map([['artifact-1', 'artifact-copy']]));

  assert.equal(
    remapped,
    `${serializeArtifactReference('artifact-copy')}${serializeArtifactReference('artifact-2')}`,
  );
});
