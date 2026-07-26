import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeSearchTaskMarkerAttribute,
  SearchTaskStreamTracker,
} from './search-task-stream.ts';

test('emits one marker for matching tool-call and tool-result events', () => {
  const tracker = new SearchTaskStreamTracker();

  assert.equal(
    tracker.start({ toolCallId: 'call-1', label: 'current market price' }),
    '<search-loading query="current market price" />',
  );
  assert.equal(
    tracker.start({ toolCallId: 'call-1', label: 'current market price' }),
    null,
  );
});

test('backfills a marker when only a successful result is observed', () => {
  const tracker = new SearchTaskStreamTracker();

  assert.equal(
    tracker.start({ toolCallId: 'result-only', label: 'Search the web' }),
    '<search-loading query="Search the web" />',
  );
});

test('deduplicates provider-native search using a stable fallback key', () => {
  const tracker = new SearchTaskStreamTracker();

  assert.ok(tracker.start({ label: 'Perplexity Search', fallbackKey: 'provider-search' }));
  assert.equal(
    tracker.start({ label: 'Perplexity Search', fallbackKey: 'provider-search' }),
    null,
  );
});

test('escapes task labels embedded in stream markers', () => {
  const tracker = new SearchTaskStreamTracker();

  assert.equal(
    tracker.start({ toolCallId: 'call-2', label: 'A & "B" < C' }),
    '<search-loading query="A &amp; &quot;B&quot; &lt; C" />',
  );
});

test('decodes escaped task labels for the client timeline', () => {
  assert.equal(
    decodeSearchTaskMarkerAttribute('A &amp; &quot;B&quot; &lt; C &gt; D'),
    'A & "B" < C > D',
  );
});
