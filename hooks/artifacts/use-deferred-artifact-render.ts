"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from 'react';

/**
 * Keeps expensive artifact renderers out of panel entrance animations. The
 * selected document mounts on the frame after the surface reports completion.
 */
export function useDeferredArtifactRender(
  artifactId: string | null,
  active: boolean,
) {
  const [readyArtifactId, setReadyArtifactId] = useState<string | null>(null);
  const artifactIdRef = useRef(artifactId);
  const activeRef = useRef(active);
  const revealFrameRef = useRef<number | null>(null);

  artifactIdRef.current = artifactId;
  activeRef.current = active;

  const cancelPendingReveal = useCallback(() => {
    if (revealFrameRef.current === null) return;
    window.cancelAnimationFrame(revealFrameRef.current);
    revealFrameRef.current = null;
  }, []);

  const revealDocument = useCallback(() => {
    const selectedArtifactId = artifactIdRef.current;
    if (!activeRef.current || !selectedArtifactId) return;

    cancelPendingReveal();
    revealFrameRef.current = window.requestAnimationFrame(() => {
      revealFrameRef.current = null;
      if (!activeRef.current || artifactIdRef.current !== selectedArtifactId) return;
      startTransition(() => setReadyArtifactId(selectedArtifactId));
    });
  }, [cancelPendingReveal]);

  useEffect(() => {
    cancelPendingReveal();
    setReadyArtifactId(null);
  }, [active, artifactId, cancelPendingReveal]);

  useEffect(() => cancelPendingReveal, [cancelPendingReveal]);

  return {
    isDocumentReady: Boolean(
      active
      && artifactId
      && readyArtifactId === artifactId
    ),
    revealDocument,
  };
}
