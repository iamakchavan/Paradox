"use client";

import { createContext, useContext } from 'react';
import type { AnswerSource } from '@/components/chat/SourceList';

export type RightWorkspaceState =
  | { type: 'closed' }
  | { type: 'artifact-library'; chatId: string }
  | { type: 'artifact'; artifactId: string; returnLibraryChatId?: string }
  | {
      type: 'sources';
      sources: AnswerSource[];
      returnArtifactId?: string;
      returnArtifactLibraryChatId?: string;
    };

export interface OpenArtifactOptions {
  returnLibraryChatId?: string;
}

export interface OpenSourcesOptions {
  returnArtifactId?: string;
  returnArtifactLibraryChatId?: string;
}

export interface RightWorkspaceContextValue {
  state: RightWorkspaceState;
  openArtifactLibrary: (chatId: string) => void;
  toggleArtifactLibrary: (chatId: string) => void;
  openArtifact: (artifactId: string, options?: OpenArtifactOptions) => void;
  openSources: (sources: AnswerSource[], options?: OpenSourcesOptions) => void;
  toggleSources: (sources: AnswerSource[]) => void;
  closeWorkspace: () => void;
  closeSources: () => void;
}

export interface RightWorkspaceActions {
  openArtifactLibrary: (chatId: string) => void;
  toggleArtifactLibrary: (chatId: string) => void;
  openArtifact: (artifactId: string, options?: OpenArtifactOptions) => void;
  openSources: (sources: AnswerSource[], options?: OpenSourcesOptions) => void;
  toggleSources: (sources: AnswerSource[]) => void;
  closeWorkspace: () => void;
  closeSources: () => void;
}

const RightWorkspaceContext = createContext<RightWorkspaceContextValue | null>(null);
const RightWorkspaceActionsContext = createContext<RightWorkspaceActions | null>(null);
export const ARTIFACT_WORKSPACE_WIDTH = 'clamp(420px, 46vw, 760px)';
export const COMPACT_WORKSPACE_WIDTH = '390px';

export const RightWorkspaceProvider = RightWorkspaceContext.Provider;
export const RightWorkspaceActionsProvider = RightWorkspaceActionsContext.Provider;

export function useRightWorkspace(): RightWorkspaceContextValue {
  const value = useContext(RightWorkspaceContext);
  if (!value) throw new Error('useRightWorkspace must be used within RightWorkspaceProvider.');
  return value;
}

export function useRightWorkspaceActions(): RightWorkspaceActions {
  const value = useContext(RightWorkspaceActionsContext);
  if (!value) throw new Error('useRightWorkspaceActions must be used within RightWorkspaceActionsProvider.');
  return value;
}

export function getRightWorkspaceWidth(state: RightWorkspaceState): string {
  if (state.type === 'artifact') return ARTIFACT_WORKSPACE_WIDTH;
  if (state.type === 'sources' || state.type === 'artifact-library') return COMPACT_WORKSPACE_WIDTH;
  return '0px';
}
