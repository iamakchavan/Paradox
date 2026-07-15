"use client";

import { useMemo, useRef } from 'react';
import { parseResearchStream, type ResearchStep } from '@/lib/research/parser';
import { normalizeSourceCollection } from '@/lib/research/source-normalization';
import { preprocessLaTeX } from '@/utils/latex';
import {
  areSearchDataEqual,
  areStepsEqual,
  autoCloseMarkdownLinks,
  cleanMarkdownCitations,
  extractSearchData,
  linkifyCitations,
  processThinkingContent,
} from './content-parser';
import type { ParsedMessageContent, SearchData, SearchResult } from './types';
import { getCleanUrl } from './url-utils';

export function useMessageContent(content: string): ParsedMessageContent {
  const previousStepsRef = useRef<ResearchStep[]>([]);
  const previousSearchDataRef = useRef<SearchData | null>(null);
  const { thinking, mainContent: rawMainContent } = useMemo(
    () => processThinkingContent(content),
    [content],
  );

  const parsed = useMemo(() => {
    let mainContent = rawMainContent;
    let researchTime = 0;
    const researchTimeMatch = mainContent.match(/<researchTime>([\d\.]+)<\/researchTime>/);
    if (researchTimeMatch) {
      researchTime = parseFloat(researchTimeMatch[1]);
      mainContent = mainContent.replace(/<researchTime>[\d\.]+<\/researchTime>/g, '');
    }

    const isDeepResearch = content.includes('<research-step');
    let parsedSteps: ResearchStep[] = [];
    let searchLoadingQuery: string | null = null;
    let parsedSearchData: SearchData | null = null;
    let toolSteps: string[] = [];
    if (isDeepResearch) {
      const researchStream = parseResearchStream(mainContent);
      parsedSteps = researchStream.steps;
      mainContent = researchStream.cleanContent;
    } else {
      const streamData = extractSearchData(content);
      searchLoadingQuery = streamData.searchLoadingQuery;
      parsedSearchData = streamData.searchData;
      toolSteps = streamData.toolSteps;
      mainContent = extractSearchData(mainContent).cleanContent;
    }

    let stepsChanged = parsedSteps.length !== previousStepsRef.current.length;
    const stabilizedSteps = parsedSteps.map((step, index) => {
      const previous = previousStepsRef.current[index];
      if (previous && areStepsEqual(step, previous)) return previous;
      stepsChanged = true;
      return step;
    });
    const steps = stepsChanged ? stabilizedSteps : previousStepsRef.current;
    previousStepsRef.current = steps;

    const searchData = areSearchDataEqual(parsedSearchData, previousSearchDataRef.current)
      ? previousSearchDataRef.current
      : parsedSearchData;
    previousSearchDataRef.current = searchData;
    return { steps, searchLoadingQuery, searchData, toolSteps, mainContent, researchTime };
  }, [content, rawMainContent]);

  const allSearchResults = useMemo(() => {
    const results: SearchResult[] = [];
    if (parsed.searchData?.results) results.push(...parsed.searchData.results);
    parsed.steps.forEach(step => {
      if (step.results) results.push(...step.results);
    });
    return normalizeSourceCollection(results);
  }, [parsed.searchData, parsed.steps]);

  const searchMap = useMemo(() => {
    if (allSearchResults.length === 0) return null;
    const map = new Map<string, { title: string; content: string }>();
    for (const item of allSearchResults) {
      if (!item.url) continue;
      const data = { title: item.title || '', content: item.content || '' };
      map.set(getCleanUrl(item.url), data);
      try {
        const domain = new URL(item.url).hostname.replace('www.', '').toLowerCase();
        if (!map.has(domain)) map.set(domain, data);
      } catch {}
    }
    return map;
  }, [allSearchResults]);

  const processedContent = useMemo(() => {
    const cleaned = cleanMarkdownCitations(parsed.mainContent);
    const closed = autoCloseMarkdownLinks(cleaned);
    return linkifyCitations(preprocessLaTeX(closed), allSearchResults);
  }, [allSearchResults, parsed.mainContent]);

  return {
    thinking,
    rawMainContent,
    ...parsed,
    allSearchResults,
    searchMap,
    processedContent,
  };
}
