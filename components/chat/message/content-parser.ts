import type { ResearchStep } from '@/lib/research/parser';
import { normalizeSourceCollection } from '@/lib/research/source-normalization';
import { decodeSearchTaskMarkerAttribute } from '@/lib/streaming/search-task-stream';
import type { SearchData } from './types';

export function processThinkingContent(content: string) {
  let mainContent = content;
  let normalizedContent = content;
  if (content.includes('</think>') && !content.includes('<think>')) {
    normalizedContent = `<think>${content}`;
  }

  const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
  const thoughts: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = thinkRegex.exec(normalizedContent)) !== null) {
    thoughts.push(match[1].trim());
  }

  const lastThinkStart = normalizedContent.lastIndexOf('<think>');
  const lastThinkEnd = normalizedContent.lastIndexOf('</think>');
  if (lastThinkStart !== -1 && (lastThinkEnd === -1 || lastThinkEnd < lastThinkStart)) {
    const ongoingThought = normalizedContent.substring(lastThinkStart + 7).trim();
    const searchTagIndex = ongoingThought.search(/<(search-loading|search-results)/);
    if (searchTagIndex !== -1) {
      thoughts.push(ongoingThought.substring(0, searchTagIndex).trim());
      mainContent = normalizedContent.substring(0, lastThinkStart) + ongoingThought.substring(searchTagIndex);
    } else {
      thoughts.push(ongoingThought);
      mainContent = normalizedContent.substring(0, lastThinkStart);
    }
  } else {
    mainContent = normalizedContent;
  }

  mainContent = mainContent.replace(thinkRegex, '').trim();
  const timeMatch = content.match(/<thinkingTime>([\d\.]+)<\/thinkingTime>/);
  if (timeMatch) {
    mainContent = mainContent.replace(/<thinkingTime>[\d\.]+<\/thinkingTime>/g, '');
  }
  return { thinking: thoughts.join('\n\n').trim(), mainContent };
}

export function extractSearchData(content: string) {
  let searchLoadingQuery: string | null = null;
  let searchData: SearchData | null = null;
  let cleanContent = content;
  let toolSteps: string[] = [];
  const resultsMatch = content.match(/<search-results>([\s\S]*?)<\/search-results>/);
  if (resultsMatch) {
    try {
      const parsed = JSON.parse(resultsMatch[1]) as SearchData;
      searchData = {
        ...parsed,
        results: normalizeSourceCollection(Array.isArray(parsed.results) ? parsed.results : []),
      };
      cleanContent = cleanContent.replace(/<search-results>[\s\S]*?<\/search-results>/g, '');
    } catch (error) {
      console.warn('Failed to parse search results:', error);
    }
  }
  const loadingMatches = Array.from(content.matchAll(/<search-loading query="([\s\S]*?)" \/>/g));
  if (loadingMatches.length > 0) {
    toolSteps = loadingMatches.map(match => decodeSearchTaskMarkerAttribute(match[1]));
    searchLoadingQuery = decodeSearchTaskMarkerAttribute(
      loadingMatches[loadingMatches.length - 1][1],
    );
    cleanContent = cleanContent.replace(/<search-loading query="[\s\S]*?" \/>/g, '');
  }
  return { searchLoadingQuery, searchData, toolSteps, cleanContent: cleanContent.trim() };
}

export function areStepsEqual(first: ResearchStep, second: ResearchStep): boolean {
  if (first.type !== second.type || first.status !== second.status
    || first.id !== second.id || first.parentId !== second.parentId
    || first.order !== second.order || first.sequence !== second.sequence
    || first.query !== second.query || first.url !== second.url) return false;
  if (!first.results && !second.results) return true;
  if (!first.results || !second.results || first.results.length !== second.results.length) return false;
  return first.results.every((result, index) => {
    const other = second.results![index];
    return result.url === other.url && result.title === other.title && result.content === other.content;
  });
}

export function areSearchDataEqual(first: SearchData | null, second: SearchData | null): boolean {
  if (!first && !second) return true;
  if (!first || !second || first.query !== second.query || first.results.length !== second.results.length) return false;
  return first.results.every((result, index) => {
    const other = second.results[index];
    return result.url === other.url && result.title === other.title && result.content === other.content;
  });
}

export function linkifyCitations(content: string, results?: Array<{ url: string }>) {
  if (!results?.length) return content;
  return content.replace(/\[(\d+)\](?!\()/g, (match, numberText) => {
    const result = results[parseInt(numberText, 10) - 1];
    return result?.url ? `[${numberText}](${result.url})` : match;
  });
}

export function cleanMarkdownCitations(text: string): string {
  if (!text) return text;
  return text.replace(/\[([^\]]+)\]\s*\(\s*(https?:\/\/[^)]+)\)/gi, (_match, label, url) => {
    const cleanUrl = url.replace(/\s+/g, '');
    let cleanLabel = label.trim();
    const compactLabel = cleanLabel.replace(/\s+/g, '');
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,10}$/.test(compactLabel)) cleanLabel = compactLabel;
    return `[${cleanLabel}](${cleanUrl})`;
  });
}

export function autoCloseMarkdownLinks(text: string): string {
  if (!text) return text;
  const lastOpenBracket = text.lastIndexOf('[');
  if (lastOpenBracket === -1) return text;
  const lastCloseBracket = text.lastIndexOf(']');
  const lastOpenParen = text.lastIndexOf('(');
  const lastCloseParen = text.lastIndexOf(')');
  return lastOpenParen > lastCloseBracket && lastCloseBracket > lastOpenBracket && lastOpenParen > lastCloseParen
    ? `${text})`
    : text;
}
