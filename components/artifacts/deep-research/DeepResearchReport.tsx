"use client";

import { memo, useMemo } from 'react';
import { MessageMarkdown } from '@/components/chat/message/markdown-renderer';
import {
  autoCloseMarkdownLinks,
  cleanMarkdownCitations,
  linkifyCitations,
} from '@/components/chat/message/content-parser';
import { getCleanUrl } from '@/components/chat/message/url-utils';
import { preprocessLaTeX } from '@/utils/latex';
import type { ArtifactSource } from '@/lib/artifacts/types';

interface Props {
  markdown: string;
  sources: ArtifactSource[];
  isStreaming: boolean;
}

export const DeepResearchReport = memo(function DeepResearchReport({
  markdown,
  sources,
  isStreaming,
}: Props) {
  const searchMap = useMemo(() => {
    if (sources.length === 0) return null;
    const map = new Map<string, { title: string; content: string }>();
    sources.forEach(source => {
      const value = { title: source.title || '', content: source.content || '' };
      map.set(getCleanUrl(source.url), value);
      try {
        const domain = new URL(source.url).hostname.replace(/^www\./, '').toLowerCase();
        if (!map.has(domain)) map.set(domain, value);
      } catch {}
    });
    return map;
  }, [sources]);

  const processed = useMemo(() => {
    const cleaned = cleanMarkdownCitations(markdown);
    const closed = autoCloseMarkdownLinks(cleaned);
    return linkifyCitations(preprocessLaTeX(closed), sources);
  }, [markdown, sources]);

  return (
    <article className="mx-auto w-full max-w-[780px] px-5 pb-24 pt-8 sm:px-8 sm:pt-10">
      {processed ? (
        <MessageMarkdown
          content={processed}
          searchMap={searchMap}
          isStreaming={isStreaming}
          messageContent={markdown}
          messageIndex={-1}
        />
      ) : (
        <div className="h-24" aria-hidden="true" />
      )}
    </article>
  );
});
