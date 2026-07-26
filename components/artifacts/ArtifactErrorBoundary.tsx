"use client";

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ArtifactErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Artifact Renderer] Failed to render document:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <h2 className="text-base font-medium text-foreground">Report preview unavailable</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The report is still stored locally. You can close this view and try opening it again.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
