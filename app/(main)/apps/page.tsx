"use client";

import { useEffect, useState } from 'react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { IntegrationsTab } from '@/components/chat/integrations/IntegrationsTab';
import { useRouter } from 'next/navigation';
import { useApiKeys } from '@/hooks/use-api-keys';
import { useSidebarContext } from '@/components/chat/SidebarContext';

export default function AppsPage() {
  const router = useRouter();
  const { keys: apiKeys } = useApiKeys();
  const {
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useSidebarContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNewChat = () => {
    router.push('/chat');
  };

  return (
    <>
      <ChatHeader
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        activeChatId={null}
        onSelectChat={(id) => {
          router.push(`/chat/${id}`);
        }}
        onNewChat={handleNewChat}
        isLibraryPageActive={false}
        setIsLibraryPageActive={() => {}}
        selectedModelId="sonar"
        setSelectedModelId={() => {}}
        isLoading={false}
        apiKeys={apiKeys}
        mounted={mounted}
        hideModelSelector={true}
      />

      <div
        tabIndex={-1}
        className="flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto pb-24 pt-24 outline-none chat-scrollbar"
      >
        <div className="max-w-4xl mx-auto w-full px-6 md:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1.5 text-zinc-900 dark:text-zinc-100">Tools & Connectors</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-normal leading-normal">
              Manage your connected applications and Model Context Protocol (MCP) integrations.
            </p>
          </div>
          <IntegrationsTab />
        </div>
      </div>
    </>
  );
}
