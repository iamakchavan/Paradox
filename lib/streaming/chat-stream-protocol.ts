import type { ArtifactStreamEvent } from '../artifacts/stream';

export const CHAT_STREAM_PROTOCOL = 'paradox-sse-json-v1';

export type ChatStreamEvent =
  | { type: 'content'; content: string }
  | { type: 'artifact'; artifact: ArtifactStreamEvent };

const FRAME_SEPARATOR = '\n\n';

function isArtifactStreamEvent(value: unknown): value is ArtifactStreamEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  if (typeof event.type !== 'string' || typeof event.artifactId !== 'string') return false;

  switch (event.type) {
    case 'start':
      return (
        (event.kind === 'deep-research-report' || event.kind === 'markdown-document')
        && typeof event.title === 'string'
      );
    case 'delta':
      return typeof event.delta === 'string';
    case 'complete':
      return true;
    case 'error':
      return typeof event.message === 'string';
    default:
      return false;
  }
}

function findFrameBoundary(buffer: string): { index: number; length: number } | null {
  const lfIndex = buffer.indexOf(FRAME_SEPARATOR);
  const crlfIndex = buffer.indexOf('\r\n\r\n');

  if (lfIndex === -1 && crlfIndex === -1) return null;
  if (crlfIndex !== -1 && (lfIndex === -1 || crlfIndex < lfIndex)) {
    return { index: crlfIndex, length: 4 };
  }
  return { index: lfIndex, length: FRAME_SEPARATOR.length };
}

export function encodeChatStreamContent(content: string): string {
  return `event: content\ndata: ${JSON.stringify(content)}${FRAME_SEPARATOR}`;
}

export function encodeChatStreamArtifact(artifact: ArtifactStreamEvent): string {
  return `event: artifact\ndata: ${JSON.stringify(artifact)}${FRAME_SEPARATOR}`;
}

export function encodeChatStreamComment(label: string, paddingLength = 0): string {
  return `: ${label}${' '.repeat(Math.max(0, paddingLength))}${FRAME_SEPARATOR}`;
}

function parseFrame(frame: string): ChatStreamEvent | null {
  if (frame.length === 0 || frame.startsWith(':')) return null;

  let eventType = '';
  const dataLines: string[] = [];

  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) {
      eventType = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      const value = line.slice('data:'.length);
      dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
    }
  }

  if (dataLines.length === 0) return null;

  const parsed: unknown = JSON.parse(dataLines.join('\n'));
  if (eventType === 'content') {
    if (typeof parsed !== 'string') throw new Error('Invalid chat stream content frame');
    return { type: 'content', content: parsed };
  }
  if (eventType === 'artifact') {
    if (!isArtifactStreamEvent(parsed)) throw new Error('Invalid artifact stream frame');
    return { type: 'artifact', artifact: parsed };
  }
  return null;
}

export class ChatStreamDecoder {
  private buffer = '';

  push(chunk: string): ChatStreamEvent[] {
    this.buffer += chunk;
    const events: ChatStreamEvent[] = [];

    let boundary = findFrameBoundary(this.buffer);
    while (boundary !== null) {
      const frame = this.buffer.slice(0, boundary.index).replace(/\r\n/g, '\n');
      this.buffer = this.buffer.slice(boundary.index + boundary.length);

      const decoded = parseFrame(frame);
      if (decoded !== null) events.push(decoded);

      boundary = findFrameBoundary(this.buffer);
    }

    return events;
  }

  finish(): ChatStreamEvent[] {
    if (this.buffer.length === 0) return [];

    const trailingFrame = this.buffer.replace(/\r\n/g, '\n').trimEnd();
    this.buffer = '';
    if (trailingFrame.length === 0 || trailingFrame.startsWith(':')) return [];

    const decoded = parseFrame(trailingFrame);
    return decoded === null ? [] : [decoded];
  }
}
