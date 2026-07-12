import type { MCPIntegration } from '@/lib/db';

export type MobileAttachView = 'main' | 'apps';

export interface MobileAttachSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachImage: () => void;
  onAttachDocument: () => void;
  searchEnabled: boolean;
  onToggleSearch?: (enabled: boolean) => void;
  researchEnabled: boolean;
  onToggleResearch?: (enabled: boolean) => void;
  activeApps: MCPIntegration[];
  selectedMcpIds: string[];
  onToggleMcpId: (id: string) => void;
  onManageConnectors: () => void;
}
