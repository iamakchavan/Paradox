"use client";

import { memo, useMemo, useState } from "react";

import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMobileBackDismiss } from "@/hooks/use-mobile-back-dismiss";
import { FaviconImage } from "./FaviconImage";
import {
  dedupeSources,
  getSourceDomain,
  SourceList,
  type AnswerSource,
} from "./SourceList";
import { useSourcesPanel } from "./SourcesPanelContext";
import { SourcesSheetHeader } from "./SourcesSheetHeader";

export type { AnswerSource } from "./SourceList";

export const AnswerSources = memo(({ sources }: { sources: AnswerSource[] }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toggleSources } = useSourcesPanel();
  const cleanSources = useMemo(() => dedupeSources(sources), [sources]);

  useMobileBackDismiss({
    isOpen: isMobileOpen,
    isMobile,
    stateKey: "paradoxAnswerSources",
    entryPrefix: "answer-sources",
    onDismiss: () => setIsMobileOpen(false),
  });
  if (cleanSources.length === 0) return null;

  const previewSources = cleanSources.slice(0, 3);
  const title = `${cleanSources.length} ${cleanSources.length === 1 ? "source" : "sources"}`;

  const trigger = (
    <button
      type="button"
      onClick={() => {
        const isDesktop = window.matchMedia("(min-width: 768px)").matches;
        if (isDesktop) {
          toggleSources(cleanSources);
        } else {
          setIsMobileOpen(true);
        }
      }}
      className="inline-flex h-7 items-center gap-1 rounded-full border border-zinc-950/[0.06] bg-zinc-100/80 px-1.5 text-[11px] font-medium text-foreground/75 transition-colors hover:bg-zinc-200/80 hover:text-foreground dark:border-white/[0.08] dark:bg-white/[0.08] dark:text-zinc-200/80 dark:hover:bg-white/[0.13] dark:hover:text-zinc-100"
      aria-label={`View ${title}`}
    >
      <span className="flex -space-x-0.5">
        {previewSources.map((source, index) => (
          <span
            key={`${source.url}-${index}`}
            className="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full"
            style={{ zIndex: previewSources.length - index }}
          >
            <FaviconImage domain={getSourceDomain(source.url)} className="h-4 w-4 rounded-full" />
          </span>
        ))}
      </span>
      <span>{title}</span>
    </button>
  );

  return (
    <>
      {trigger}

      <MobileBottomSheet
        open={isMobileOpen}
        onOpenChange={setIsMobileOpen}
        title="Sources"
        description={`${title} checked for this answer`}
        className="h-[82dvh] min-h-[320px] md:hidden"
      >
        <SourcesSheetHeader
          description={`${title} checked for this answer`}
          onClose={() => setIsMobileOpen(false)}
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-[72px] sidebar-scroll">
          <SourceList sources={cleanSources} />
        </div>
      </MobileBottomSheet>
    </>
  );
});

AnswerSources.displayName = "AnswerSources";
