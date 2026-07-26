import type { MCPIntegration } from '@/lib/db';

export interface ChatInputProps {
  message?: string;
  setMessage?: (message: string) => void;
  handleSubmit: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
  geminiApiKey: string | null;
  mistralApiKey: string | null;
  perplexityApiKey: string | null;
  zenmuxApiKey: string | null;
  nvidiaApiKey: string | null;
  inceptionApiKey: string | null;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImages: string[];
  removeImage: (index: number) => void;
  selectedPDFs: { name: string; data: string }[];
  removePDF: (index: number) => void;
  error: string | null;
  isInitialView?: boolean;
  shouldFocus?: boolean;
  searchEnabled?: boolean;
  onToggleSearch?: (enabled: boolean) => void;
  researchEnabled?: boolean;
  onToggleResearch?: (enabled: boolean) => void;
  onExpandedChange?: (expanded: boolean) => void;
  onOpenSettingsTab?: (tab: 'ai-providers' | 'search-scraping' | 'appearance' | 'integrations') => void;
  selectedMcpIds?: string[];
  onToggleMcpId?: (id: string) => void;
}

export type ConnectedApp = MCPIntegration;
