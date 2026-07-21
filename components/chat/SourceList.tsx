"use client";

import { ArrowUpRight } from "lucide-react";

import { normalizeSourceCollection } from "@/lib/research/source-normalization";
import { FaviconImage } from "./FaviconImage";

export interface AnswerSource {
  title: string;
  url: string;
  content: string;
}

export function getSourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function dedupeSources(sources: AnswerSource[]): AnswerSource[] {
  return normalizeSourceCollection(sources);
}

interface SourceListProps {
  sources: AnswerSource[];
  onSourceClick?: () => void;
}

export function SourceList({ sources, onSourceClick }: SourceListProps) {
  return (
    <div className="min-w-0 w-full overflow-hidden divide-y divide-zinc-200/60 dark:divide-white/[0.07]">
      {sources.map((source, index) => {
        const domain = getSourceDomain(source.url);

        return (
          <a
            key={`${source.url}-${index}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onSourceClick}
            className="group flex min-w-0 w-full gap-3 overflow-hidden py-4 no-underline transition-opacity [content-visibility:auto] [contain-intrinsic-size:0_104px] active:opacity-70"
          >
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-start justify-center">
              <FaviconImage domain={domain} className="h-4 w-4 rounded-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-3">
                <h3 className="line-clamp-2 min-w-0 flex-1 [overflow-wrap:anywhere] text-[13px] font-medium leading-snug text-foreground/90 group-hover:text-foreground">
                  {source.title || domain}
                </h3>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/55">
                  {index + 1}
                </span>
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-muted-foreground/75">
                <span className="min-w-0 truncate">{domain}</span>
                <ArrowUpRight className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
              </div>
              {source.content && (
                <p className="mt-1.5 line-clamp-3 [overflow-wrap:anywhere] text-[11px] leading-relaxed text-muted-foreground/80">
                  {source.content}
                </p>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}
