import type { ResearchStep } from '@/lib/research/parser';
import type { ParsedDeepResearchArtifact } from '@/lib/artifacts/deep-research';

export interface ChatMessageData {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  pdfs?: { name: string; data: string }[];
}

export interface MessageProps {
  message: ChatMessageData;
  index: number;
  isStreaming: boolean;
  expandedThinking: number[];
  setExpandedThinking: (value: (previous: number[]) => number[]) => void;
  modelMode?: string;
  onBranchOff?: (index: number) => void;
  chatId?: string | null;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface SearchData {
  query: string;
  results: SearchResult[];
}

export interface ParsedMessageContent {
  thinking: string;
  rawMainContent: string;
  steps: ResearchStep[];
  searchLoadingQuery: string | null;
  searchData: SearchData | null;
  toolSteps: string[];
  mainContent: string;
  researchTime: number;
  allSearchResults: SearchResult[];
  searchMap: Map<string, { title: string; content: string }> | null;
  processedContent: string;
  artifact: ParsedDeepResearchArtifact | null;
}
