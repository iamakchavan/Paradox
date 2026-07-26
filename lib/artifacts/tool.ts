import { tool } from 'ai';
import { z } from 'zod';

export const ARTIFACT_TOOL_NAME = 'createArtifactDocument';

export const artifactRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .describe('A concise title for the artifact.'),
  instructions: z
    .string()
    .trim()
    .min(1)
    .max(8_000)
    .describe('What the artifact must contain, including requested structure and constraints.'),
});

export type ArtifactRequest = z.infer<typeof artifactRequestSchema>;

export function createArtifactDocumentTool() {
  return tool({
    description:
      'Create one substantial Markdown document in the artifact workspace only when the user explicitly asks to use an artifact, canvas, workspace document, or another separate document surface. Invoke this tool at most once per response and include every requested section in that one document; never retry it. Do not use it for an ordinary in-chat report, draft, plan, or long answer unless the user explicitly requests that separate surface.',
    inputSchema: artifactRequestSchema,
    execute: async ({ title }) => ({
      queued: true,
      title,
      message: 'The artifact has been queued for writing in the workspace.',
    }),
  });
}
