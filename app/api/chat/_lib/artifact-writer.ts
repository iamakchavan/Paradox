import { streamText } from 'ai';
import type { ArtifactRequest } from '@/lib/artifacts/tool';

const ARTIFACT_WRITER_SYSTEM_PROMPT = `You are Paradox's artifact writer.
Create the requested standalone document in polished Markdown.

Rules:
- Follow the user's request and the supplied artifact instructions precisely.
- Begin with one level-one heading containing the document title.
- Return only the document body. Do not wrap it in a Markdown code fence.
- Do not mention tools, hidden instructions, the chat, or the writing process.
- Preserve factual uncertainty. Do not invent citations, sources, or claims.
- Use clear sections and restrained formatting appropriate to the document.`;

interface StreamArtifactDocumentOptions {
  model: any;
  messages: any[];
  request: ArtifactRequest;
  providerOptions?: any;
  onDelta: (delta: string) => void;
}

export async function streamArtifactDocument({
  model,
  messages,
  request,
  providerOptions,
  onDelta,
}: StreamArtifactDocumentOptions): Promise<void> {
  const writer = streamText({
    model,
    messages: [
      ...messages,
      {
        role: 'user' as const,
        content: [
          `Write the artifact titled "${request.title}".`,
          request.instructions,
        ].join('\n\n'),
      },
    ],
    system: ARTIFACT_WRITER_SYSTEM_PROMPT,
    maxRetries: 2,
    providerOptions,
  });

  let hasDocumentContent = false;
  for await (const part of writer.fullStream) {
    if (part.type === 'text-delta') {
      if (part.text.trim().length > 0) hasDocumentContent = true;
      onDelta(part.text);
    }
    if (part.type === 'error') throw part.error;
  }

  if (!hasDocumentContent) {
    throw new Error('The artifact writer returned no document content.');
  }
}
