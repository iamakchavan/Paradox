"use client";

import { X } from "lucide-react";

import { FloatingIconButton } from "@/components/ui/floating-icon-button";

interface SourcesSheetHeaderProps {
  description: string;
  onClose: () => void;
}

export function SourcesSheetHeader({
  description,
  onClose,
}: SourcesSheetHeaderProps) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 progressive-blur-top"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 top-6 z-30 px-5 pb-3 pt-2 text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Sources</h2>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <FloatingIconButton onClick={onClose} aria-label="Close sources">
            <X className="h-4 w-4" />
          </FloatingIconButton>
        </div>
      </div>
    </>
  );
}
