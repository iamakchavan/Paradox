"use client";

import { useMemo } from 'react';
import { useRightWorkspace } from '@/components/workspace/RightWorkspaceContext';

export function useSourcesPanel() {
  const workspace = useRightWorkspace();
  return useMemo(() => ({
    sources: workspace.state.type === 'sources' ? workspace.state.sources : [],
    isOpen: workspace.state.type === 'sources',
    toggleSources: workspace.toggleSources,
    closeSources: workspace.closeSources,
  }), [workspace]);
}
