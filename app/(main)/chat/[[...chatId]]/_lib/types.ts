export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  pdfs?: ChatPdfAttachment[];
}

export interface ChatPdfAttachment {
  name: string;
  data: string;
}

export type SettingsTab = 'ai-providers' | 'search-scraping' | 'appearance';
export type OpenSettingsTab = SettingsTab | 'integrations';

