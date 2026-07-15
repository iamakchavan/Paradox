import type { SearchResult } from '@/lib/research/client';
import type { ChatRequestMessage } from '../../_lib/types';

export interface ResearchRequestBody {
  messages: ChatRequestMessage[];
  model: string;
  systemPrompt?: string;
}

export type ResearchStepType = 'search' | 'x' | 'scrape' | 'map';

export interface ResearchPlanStep {
  query: string;
  type: ResearchStepType;
  scrapeUrls: boolean;
}

export interface ResearchPlanResult {
  researchNeeded: boolean;
  plan: ResearchPlanStep[];
}

export interface SearchResultBucket {
  query: string;
  results: SearchResult[];
}

export interface ScrapedDocument {
  url: string;
  title: string;
  content: string;
}

export interface ResearchExecutionResult {
  searchResults: SearchResultBucket[];
  scrapedDocuments: ScrapedDocument[];
  wasTruncated?: boolean;
}

export type ResearchStreamEmitter = (content: string) => void;
