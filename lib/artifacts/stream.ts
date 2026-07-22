import type { ArtifactKind } from './types';

export type ArtifactStreamEvent =
  | {
      type: 'start';
      artifactId: string;
      kind: ArtifactKind;
      title: string;
    }
  | {
      type: 'delta';
      artifactId: string;
      delta: string;
    }
  | {
      type: 'complete';
      artifactId: string;
    }
  | {
      type: 'error';
      artifactId: string;
      message: string;
    };
