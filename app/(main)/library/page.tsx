"use client";

import { useEffect, useState } from 'react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { LibraryPageContent } from '@/components/chat/LibraryPageContent';
import { useRouter } from 'next/navigation';
import { useApiKeys } from '@/hooks/use-api-keys';
import { useSidebarContext } from '@/components/chat/SidebarContext';

export default function LibraryPage() {
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
        isLibraryPageActive={true}
        setIsLibraryPageActive={() => {}}
        selectedModelId="sonar"
        setSelectedModelId={() => {}}
        isLoading={false}
        apiKeys={apiKeys}
        mounted={mounted}
      />

      <div className="flex-1 w-full pt-24 pb-24 flex flex-col items-center justify-start">
        <LibraryPageContent
          onSelectChat={(id) => {
            router.push(`/chat/${id}`);
          }}
        />
      </div>
    </>
  );
}
