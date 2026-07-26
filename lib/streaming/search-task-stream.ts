interface SearchTaskStart {
  toolCallId?: string;
  label: string;
  fallbackKey?: string;
}

function escapeMarkerAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function decodeSearchTaskMarkerAttribute(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Keeps search task markers idempotent when providers reorder or omit tool-call events.
 * A successful tool result can safely ensure its start marker without duplicating the
 * marker already emitted for a normal tool-call event.
 */
export class SearchTaskStreamTracker {
  private readonly startedKeys = new Set<string>();

  start({ toolCallId, label, fallbackKey }: SearchTaskStart): string | null {
    const normalizedLabel = label.trim();
    if (!normalizedLabel) return null;

    const normalizedCallId = toolCallId?.trim();
    const key = normalizedCallId
      ? `call:${normalizedCallId}`
      : `fallback:${fallbackKey?.trim() || normalizedLabel}`;

    if (this.startedKeys.has(key)) return null;
    this.startedKeys.add(key);

    return `<search-loading query="${escapeMarkerAttribute(normalizedLabel)}" />`;
  }
}
