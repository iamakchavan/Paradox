'use client';

import { ConnectorsGrid } from './ConnectorsGrid';
import { CustomConnectorDialog } from './CustomConnectorDialog';
import { IntegrationsToolbar } from './IntegrationsToolbar';
import { SkillDetailDialog } from './SkillDetailDialog';
import { SkillsGrid } from './SkillsGrid';
import { TemplateConnectorDialog } from './TemplateConnectorDialog';
import { useCustomConnectorForm } from './use-custom-connector-form';
import { useIntegrationActions } from './use-integration-actions';
import { useIntegrationsViewModel } from './use-integrations-view-model';

export { PROVIDER_LOGOS } from './provider-catalog';

export function IntegrationsTab() {
  const view = useIntegrationsViewModel();
  const actions = useIntegrationActions();

  const dismissCustomDialog = () => {
    view.setIsRegisteringCustom(false);
    view.setShowAdvanced(false);
  };
  const form = useCustomConnectorForm({
    triggerOAuthFlow: actions.triggerOAuthFlow,
    syncTools: actions.syncTools,
    closeDialog: dismissCustomDialog,
  });
  const closeAndResetCustomDialog = () => {
    dismissCustomDialog();
    form.resetCustomForm();
  };
  const activeConnection = view.activeTemplate
    ? view.integrations.find(integration => integration.id === view.activeTemplate?.id)
    : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col space-y-5 font-sans text-foreground">
      <IntegrationsToolbar
        activeTab={view.activeSubTab}
        setActiveTab={view.setActiveSubTab}
        searchQuery={view.searchQuery}
        setSearchQuery={view.setSearchQuery}
        onNewConnector={() => view.setIsRegisteringCustom(true)}
      />
      <div className="no-scrollbar flex-1 overflow-y-auto pb-4 pr-0.5">
        {view.activeSubTab === 'skills' ? (
          <SkillsGrid tools={view.filteredTools} onSelect={view.setSelectedSkill} />
        ) : (
          <ConnectorsGrid
            integrations={view.integrations}
            templates={view.filteredTemplates}
            customConnectors={view.filteredCustomConnectors}
            onOpenTemplate={view.openTemplate}
            customTemplate={view.customTemplate}
          />
        )}
      </div>
      <TemplateConnectorDialog
        template={view.activeTemplate}
        connection={activeConnection}
        isSyncing={Boolean(activeConnection && actions.isSyncing[activeConnection.id])}
        showAllTools={view.showAllTools}
        setShowAllTools={view.setShowAllTools}
        onClose={() => view.setActiveTemplate(null)}
        onSync={actions.syncTools}
        onConnect={template => actions.handleConnectOAuth(template.id, template.url)}
        onDelete={actions.handleDeleteIntegration}
      />
      <CustomConnectorDialog
        open={view.isRegisteringCustom}
        showAdvanced={view.showAdvanced}
        setShowAdvanced={view.setShowAdvanced}
        form={form}
        onDismiss={dismissCustomDialog}
        onCloseAndReset={closeAndResetCustomDialog}
      />
      <SkillDetailDialog skill={view.selectedSkill} onClose={() => view.setSelectedSkill(null)} />
    </div>
  );
}
