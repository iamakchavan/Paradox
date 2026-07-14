"use client";

import { ArrowUpRight } from "lucide-react";

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
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (!source.url || seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

export function SourceList({ sources }: { sources: AnswerSource[] }) {
  return (
    <div className="divide-y divide-zinc-200/60 dark:divide-white/[0.07]">
      {sources.map((source, index) => {
        const domain = getSourceDomain(source.url);

        return (
          <a
            key={`${source.url}-${index}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-3 py-4 no-underline transition-opacity active:opacity-70"
          >
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-start justify-center">
              <FaviconImage domain={domain} className="h-4 w-4 rounded-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <h3 className="line-clamp-2 flex-1 text-[13px] font-medium leading-snug text-foreground/90 group-hover:text-foreground">
                  {source.title || domain}
                </h3>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/55">
                  {index + 1}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/75">
                <span className="truncate">{domain}</span>
                <ArrowUpRight className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
              </div>
              {source.content && (
                <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground/80">
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
