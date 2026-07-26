import type { ArtifactStatus } from './types';
import { getArtifactVersionId } from './identity';

export type ReportArtifactEventStatus = 'started' | 'completed' | 'failed';

export interface ParsedDeepResearchArtifact {
  status: ArtifactStatus;
  markdown: string;
  title: string;
}

const REPORT_MARKER_PATTERN = /<artifact-report\s+status="(started|completed|failed)"\s*\/>/g;
const REPORT_MARKER_ONLY_PATTERN = /<artifact-report\s+status="(?:started|completed|failed)"\s*\/>/g;

export function serializeReportArtifactEvent(status: ReportArtifactEventStatus): string {
  return `<artifact-report status="${status}" />`;
}

export function getDeepResearchArtifactId(chatId: string, messageId: number): string {
  return `${chatId}:deep-research-report:${messageId}`;
}

export function getDeepResearchVersionId(artifactId: string, version = 1): string {
  return getArtifactVersionId(artifactId, version);
}

export function getReportTitle(markdown: string, fallback?: string): string {
  const heading = markdown.match(/^\s*#\s+(.+?)\s*$/m)?.[1];
  const candidate = heading || fallback || 'Deep Research Report';
  const plainTitle = candidate
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainTitle) return 'Deep Research Report';
  return plainTitle.length > 140 ? `${plainTitle.slice(0, 137).trimEnd()}...` : plainTitle;
}

export function parseDeepResearchArtifact(content: string): {
  artifact: ParsedDeepResearchArtifact | null;
  cleanContent: string;
} {
  const markers = Array.from(content.matchAll(REPORT_MARKER_PATTERN));
  const start = markers.find(marker => marker[1] === 'started');
  if (!start || start.index === undefined) {
    return { artifact: null, cleanContent: content };
  }

  const startEnd = start.index + start[0].length;
  const terminal = markers.find(marker => (
    marker.index !== undefined
    && marker.index >= startEnd
    && (marker[1] === 'completed' || marker[1] === 'failed')
  ));
  const reportEnd = terminal?.index ?? content.length;
  const rawReport = content.slice(startEnd, reportEnd);
  const markdown = stripArtifactControlContent(rawReport).trim();
  const terminalEnd = terminal?.index === undefined
    ? content.length
    : terminal.index + terminal[0].length;
  const cleanContent = `${content.slice(0, start.index)}${content.slice(terminalEnd)}`
    .replace(REPORT_MARKER_ONLY_PATTERN, '')
    .trim();

  return {
    artifact: {
      status: terminal?.[1] === 'completed'
        ? 'complete'
        : terminal?.[1] === 'failed'
          ? 'failed'
          : 'streaming',
      markdown,
      title: getReportTitle(markdown),
    },
    cleanContent,
  };
}

export function stripArtifactControlMarkers(content: string): string {
  return content.replace(REPORT_MARKER_ONLY_PATTERN, '');
}

export function ensureReportArtifactTerminalStatus(
  content: string,
  status: Extract<ReportArtifactEventStatus, 'completed' | 'failed'>,
): string {
  if (!content.includes(serializeReportArtifactEvent('started'))) return content;
  if (
    content.includes(serializeReportArtifactEvent('completed'))
    || content.includes(serializeReportArtifactEvent('failed'))
  ) {
    return content;
  }
  return `${content}${serializeReportArtifactEvent(status)}`;
}

function stripArtifactControlContent(content: string): string {
  let cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<research-step\b[^>]*\/>/g, '')
    .replace(/<search-results(?:\s+step-id="[^"]+")?>[\s\S]*?<\/search-results>/g, '')
    .replace(/<researchTime>[\d.]+<\/researchTime>/g, '')
    .replace(REPORT_MARKER_ONLY_PATTERN, '');

  const unmatchedThinkingStart = cleaned.lastIndexOf('<think>');
  const unmatchedThinkingEnd = cleaned.lastIndexOf('</think>');
  if (unmatchedThinkingStart > unmatchedThinkingEnd) {
    cleaned = cleaned.slice(0, unmatchedThinkingStart);
  }

  return cleaned.replace(/<\/?think>/g, '');
}
