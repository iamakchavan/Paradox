import type { ChatRequestMessage } from './types';

export function normalizeMessages(messages: ChatRequestMessage[]): ChatRequestMessage[] {
  if (!messages || messages.length === 0) return [];

  const normalized: ChatRequestMessage[] = [];
  for (const message of messages) {
    if (normalized.length === 0) {
      if (message.role !== 'user') {
        continue;
      }
      normalized.push({ ...message });
      continue;
    }

    const last = normalized[normalized.length - 1];
    if (last.role === message.role) {
      if (typeof last.content === 'string' && typeof message.content === 'string') {
        last.content = `${last.content}\n\n${message.content}`.trim();
      } else {
        const lastParts = Array.isArray(last.content)
          ? last.content
          : [{ type: 'text', text: last.content || '' }];
        const newParts = Array.isArray(message.content)
          ? message.content
          : [{ type: 'text', text: message.content || '' }];
        last.content = [...lastParts, ...newParts];
      }
    } else {
      normalized.push({ ...message });
    }
  }

  return normalized;
}

export function formatMessagesForModel(messages: ChatRequestMessage[]): any[] {
  return normalizeMessages(messages).map((message) => {
    if (message.role === 'tool') {
      return {
        role: 'tool' as const,
        content: message.content,
      } as any;
    }

    const hasImages = Boolean(message.images?.length);
    const hasPdfs = Boolean(message.pdfs?.length);
    let content = message.content || '';

    if (message.role === 'assistant' && !content.trim()) {
      content = '...';
    }

    if (hasImages || hasPdfs) {
      const parts: any[] = [{ type: 'text', text: content }];

      message.images?.forEach((image) => {
        parts.push({ type: 'image', image });
      });

      message.pdfs?.forEach((pdf) => {
        parts.push({
          type: 'file',
          data: pdf.data,
          mediaType: 'application/pdf',
          filename: pdf.name,
        });
      });

      return {
        role: message.role === 'user' ? 'user' : message.role === 'assistant' ? 'assistant' : message.role,
        content: parts,
        toolCalls: message.toolCalls,
      } as any;
    }

    return {
      role: message.role === 'user' ? 'user' : message.role === 'assistant' ? 'assistant' : message.role,
      content,
      toolCalls: message.toolCalls,
    } as any;
  });
}

