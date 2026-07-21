export const CHAT_STREAM_PROTOCOL = 'paradox-sse-json-v1';

const FRAME_SEPARATOR = '\n\n';

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

export function encodeChatStreamComment(label: string, paddingLength = 0): string {
  return `: ${label}${' '.repeat(Math.max(0, paddingLength))}${FRAME_SEPARATOR}`;
}

function parseContentFrame(frame: string): string | null {
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

  if (eventType !== 'content' || dataLines.length === 0) return null;

  const parsed: unknown = JSON.parse(dataLines.join('\n'));
  if (typeof parsed !== 'string') {
    throw new Error('Invalid chat stream content frame');
  }
  return parsed;
}

export class ChatStreamDecoder {
  private buffer = '';

  push(chunk: string): string[] {
    this.buffer += chunk;
    const content: string[] = [];

    let boundary = findFrameBoundary(this.buffer);
    while (boundary !== null) {
      const frame = this.buffer.slice(0, boundary.index).replace(/\r\n/g, '\n');
      this.buffer = this.buffer.slice(boundary.index + boundary.length);

      const decoded = parseContentFrame(frame);
      if (decoded !== null) content.push(decoded);

      boundary = findFrameBoundary(this.buffer);
    }

    return content;
  }

  finish(): string[] {
    if (this.buffer.length === 0) return [];

    const trailingFrame = this.buffer.replace(/\r\n/g, '\n').trimEnd();
    this.buffer = '';
    if (trailingFrame.length === 0 || trailingFrame.startsWith(':')) return [];

    const decoded = parseContentFrame(trailingFrame);
    return decoded === null ? [] : [decoded];
  }
}
