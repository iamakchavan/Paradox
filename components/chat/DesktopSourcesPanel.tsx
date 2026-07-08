"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { FloatingIconButton } from "@/components/ui/floating-icon-button";
import { SourceList } from "./SourceList";
import { useSourcesPanel } from "./SourcesPanelContext";

export function DesktopSourcesPanel() {
  const { sources, isOpen, closeSources } = useSourcesPanel();
  const title = `${sources.length} ${sources.length === 1 ? "source" : "sources"}`;

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 overflow-hidden border-l border-zinc-200/70 bg-background transition-[width,opacity] duration-300 ease-in-out dark:border-white/[0.07] md:flex",
        isOpen ? "w-[390px] opacity-100" : "w-0 border-l-0 opacity-0"
      )}
      aria-hidden={!isOpen}
    >
      <div className="relative flex h-full w-[390px] min-w-[390px] flex-col">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 progressive-blur-top"
          aria-hidden="true"
        />
        <header className="absolute inset-x-0 top-0 z-30 flex h-[72px] items-center justify-between gap-4 px-5">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-foreground">Sources</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{title} checked for this answer</p>
          </div>
          <FloatingIconButton
            onClick={closeSources}
            aria-label="Close sources"
          >
            <X className="h-4 w-4" />
          </FloatingIconButton>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pb-16 pt-[72px] sidebar-scroll">
          <SourceList sources={sources} />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 progressive-blur"
          aria-hidden="true"
        />
      </div>
    </aside>
  );
}
