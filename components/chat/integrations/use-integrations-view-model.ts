"use client";

import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Puzzle } from 'lucide-react';
import { db } from '@/lib/db';
import { PROVIDER_TEMPLATES, type ProviderTemplate } from './provider-catalog';

export interface IntegrationToolView {
  name: string;
  namespacedName: string;
  description: string;
  inputSchema: any;
  integrationName: string;
  integrationId: string;
}

export function useIntegrationsViewModel() {
  const integrations = useLiveQuery(() => db.mcpIntegrations.toArray()) || [];
  const [isRegisteringCustom, setIsRegisteringCustom] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'connectors'>('connectors');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<ProviderTemplate | null>(null);
  const [showAllTools, setShowAllTools] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<IntegrationToolView | null>(null);

  useEffect(() => {
    const restoreProvider = sessionStorage.getItem('settings-restore-provider');
    if (!restoreProvider) return;
    const template = PROVIDER_TEMPLATES.find(item => item.id === restoreProvider);
    if (template) {
      setActiveTemplate(template);
      sessionStorage.removeItem('settings-restore-provider');
      return;
    }
    if (integrations.some(integration => integration.id === restoreProvider)) {
      sessionStorage.removeItem('settings-restore-provider');
    }
  }, [integrations]);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const customConnectors = integrations.filter(
      integration => !PROVIDER_TEMPLATES.some(template => template.id === integration.id),
    );
    const filteredCustomConnectors = customConnectors.filter(connector => (
      connector.name.toLowerCase().includes(query) || connector.url.toLowerCase().includes(query)
    ));
    const filteredTemplates = PROVIDER_TEMPLATES.filter(template => (
      template.name.toLowerCase().includes(query) || template.desc.toLowerCase().includes(query)
    ));
    const allConnectedTools: IntegrationToolView[] = integrations.flatMap(integration => (
      (integration.cachedTools || []).map(tool => ({
        ...tool,
        integrationName: integration.name,
        integrationId: integration.id,
      }))
    ));
    const filteredTools = allConnectedTools.filter(tool => (
      tool.name.toLowerCase().includes(query)
      || tool.description.toLowerCase().includes(query)
      || tool.integrationName.toLowerCase().includes(query)
    ));
    return { filteredCustomConnectors, filteredTemplates, filteredTools };
  }, [integrations, searchQuery]);

  const openTemplate = (template: ProviderTemplate) => {
    setActiveTemplate(template);
    setShowAllTools(false);
  };
  const customTemplate = (integration: (typeof integrations)[number]): ProviderTemplate => ({
    id: integration.id,
    name: integration.name,
    desc: 'Custom user-registered SSE Server.',
    icon: Puzzle,
    type: 'custom',
    url: integration.url,
    category: 'Custom Connectors',
  });

  return {
    integrations,
    isRegisteringCustom,
    setIsRegisteringCustom,
    showAdvanced,
    setShowAdvanced,
    activeSubTab,
    setActiveSubTab,
    searchQuery,
    setSearchQuery,
    activeTemplate,
    setActiveTemplate,
    showAllTools,
    setShowAllTools,
    selectedSkill,
    setSelectedSkill,
    openTemplate,
    customTemplate,
    ...filteredData,
  };
}
