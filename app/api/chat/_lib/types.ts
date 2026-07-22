import type { MCPIntegration } from '@/lib/db';
import type { ArtifactRequestDocument } from '@/lib/artifacts/request-context';

export interface ChatRequestMessage {
  role: string;
  content?: any;
  images?: string[];
  pdfs?: Array<{ name: string; data: string }>;
  toolCalls?: any[];
  toolName?: string;
}

export interface ChatRequestBody {
  messages?: ChatRequestMessage[];
  model: string;
  systemPrompt?: string;
  mcpServers?: MCPIntegration[];
  artifactContext?: ArtifactRequestDocument[];
}

export interface ProviderKeys {
  geminiKey: string | null;
  mistralKey: string | null;
  perplexityKey: string | null;
  zenmuxKey: string | null;
  inceptionKey: string | null;
  nvidiaKey: string | null;
}

export interface SearchKeys {
  tavilyKey?: string | null;
  exaKey?: string | null;
  firecrawlKey?: string | null;
}

export interface ChatRequestHeaders {
  providerKeys: ProviderKeys;
  searchKeys: SearchKeys;
  searchEnabled: boolean;
}

export interface SearchResultItem {
  title: string;
  url: string;
  content: string;
}

export interface SearchResultData {
  query: string;
  results: SearchResultItem[];
}

