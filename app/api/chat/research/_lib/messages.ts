import type { ChatRequestMessage } from '../../_lib/types';

export function formatResearchMessages(messages: ChatRequestMessage[]): any[] {
  return messages.map((message) => {
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
        role: message.role === 'user' ? 'user' : 'assistant',
        content: parts,
      };
    }

    return {
      role: message.role === 'user' ? 'user' : 'assistant',
      content,
    };
  });
}

