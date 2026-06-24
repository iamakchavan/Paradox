"use client";

import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/chat/sidebar';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { SidebarContext } from '@/components/chat/SidebarContext';
import { cn } from '@/lib/utils';
import { LayoutGroup } from 'framer-motion';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSettingsActive, setIsSettingsActive] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsSidebarCollapsed(saved === 'true');
    }
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Dismiss search & settings view when navigating to a library or another page
  useEffect(() => {
    if (pathname !== '/chat' && !pathname.startsWith('/chat/')) {
      // Navigated away from chat entirely (e.g. /library) — close search and settings
      setIsSearchActive(false);
      setIsSettingsActive(false);
    }
  }, [pathname]);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => {
          const next = !prev;
          localStorage.setItem('sidebar-collapsed', String(next));
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeChatId = useMemo(() => {
    if (!params?.chatId) return null;
    return Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;
  }, [params?.chatId]);

  const handleNewChat = () => {
    setIsSearchActive(false);
    setIsSettingsActive(false);
    router.push('/chat');
  };

  const isLibraryActive = pathname === '/library';

  return (
    <SidebarContext.Provider
      value={{
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        isSearchActive,
        setIsSearchActive,
        isSettingsActive,
        setIsSettingsActive,
      }}
    >
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar
          activeChatId={activeChatId}
          onSelectChat={(id) => {
            setIsSearchActive(false);
            setIsSettingsActive(false);
            router.push(`/chat/${id}`);
          }}
          onNewChat={handleNewChat}
          onCollapse={() => {
            setIsSidebarCollapsed(true);
            localStorage.setItem('sidebar-collapsed', 'true');
          }}
          isSearchActive={isSearchActive}
          onSearchClick={() => {
            // If we're not on the chat page, navigate there first
            if (pathname !== '/chat' && !pathname.startsWith('/chat/')) {
              router.push('/chat');
            }
            setIsSearchActive(!isSearchActive);
            setIsSettingsActive(false);
          }}
          isLibraryActive={isLibraryActive}
          onLibraryClick={() => {
            setIsSearchActive(false);
            setIsSettingsActive(false);
            router.push('/library');
          }}
          isSettingsActive={isSettingsActive}
          onSettingsClick={() => {
            if (pathname !== '/chat' && !pathname.startsWith('/chat/')) {
              router.push('/chat');
            }
            setIsSettingsActive(!isSettingsActive);
            setIsSearchActive(false);
          }}
          className={cn(
            "fixed top-0 bottom-0 left-0 z-50 h-screen hidden md:flex",
            mounted && "transition-[transform,box-shadow] duration-300 ease-in-out",
            isSidebarCollapsed ? "-translate-x-full shadow-none" : "translate-x-0 shadow-2xl shadow-black/5 dark:shadow-black/20"
          )}
        />
        <div
          className={cn(
            "flex-1 flex flex-col h-full relative chat-scrollbar",
            (isSearchActive || isSettingsActive) ? "overflow-hidden" : "overflow-y-auto",
            mounted && "transition-[padding-left] duration-300 ease-in-out",
            isSidebarCollapsed ? "md:pl-0" : "md:pl-64"
          )}
        >
          <main className="flex flex-col min-h-screen bg-background">
            <LayoutGroup id="chat-layout-group">
              {children}
            </LayoutGroup>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
