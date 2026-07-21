import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ChatStreamDecoder,
  encodeChatStreamComment,
  encodeChatStreamContent,
} from './chat-stream-protocol.ts';

test('preserves whitespace-only content frames', () => {
  const decoder = new ChatStreamDecoder();
  const wire = [
    encodeChatStreamComment('padding', 4096),
    encodeChatStreamContent('Hello'),
    encodeChatStreamContent(' '),
    encodeChatStreamContent('world'),
    encodeChatStreamContent('\n\n  indented'),
  ].join('');

  assert.deepEqual(decoder.push(wire), ['Hello', ' ', 'world', '\n\n  indented']);
  assert.deepEqual(decoder.finish(), []);
});

test('handles frames split and coalesced across arbitrary network chunks', () => {
  const decoder = new ChatStreamDecoder();
  const wire = [
    encodeChatStreamComment('padding', 2048),
    encodeChatStreamContent('first'),
    encodeChatStreamComment('heartbeat'),
    encodeChatStreamContent('\n'),
    encodeChatStreamContent(': heartbeat'),
  ].join('');
  const splitPoints = [1, 7, 31, 105, 1024, wire.length - 3, wire.length];
  const output = [];
  let start = 0;

  for (const end of splitPoints) {
    output.push(...decoder.push(wire.slice(start, end)));
    start = end;
  }

  assert.deepEqual(output, ['first', '\n', ': heartbeat']);
  assert.deepEqual(decoder.finish(), []);
});

test('accepts CRLF-delimited frames', () => {
  const decoder = new ChatStreamDecoder();
  const wire = [
    encodeChatStreamComment('heartbeat'),
    encodeChatStreamContent('preserved content'),
  ].join('').replaceAll('\n', '\r\n');

  assert.deepEqual(decoder.push(wire), ['preserved content']);
  assert.deepEqual(decoder.finish(), []);
});
