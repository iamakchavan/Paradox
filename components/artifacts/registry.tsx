"use client";

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { ArtifactKind, ArtifactSource } from '@/lib/artifacts/types';
import { ArtifactLoadingState } from './ArtifactLoadingState';

export interface ArtifactRendererProps {
  markdown: string;
  sources: ArtifactSource[];
  isStreaming: boolean;
}

const DeepResearchReport = dynamic(
  () => import('./deep-research/DeepResearchReport').then(module => module.DeepResearchReport),
  {
    ssr: false,
    loading: () => <ArtifactLoadingState label="Preparing report renderer" />,
  },
);

export const artifactRendererRegistry: Record<ArtifactKind, ComponentType<ArtifactRendererProps>> = {
  'deep-research-report': DeepResearchReport,
};
