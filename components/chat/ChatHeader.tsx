import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Sidebar } from '@/components/chat/sidebar';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { Settings, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiKeys } from '@/hooks/use-api-keys';
import { useSidebarContext } from '@/components/chat/SidebarContext';

interface ChatHeaderProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  isLibraryPageActive: boolean;
  setIsLibraryPageActive: (active: boolean) => void;
  selectedModelId: string;
  setSelectedModelId: (modelId: string) => void;
  isLoading: boolean;
  apiKeys: ApiKeys;
  mounted: boolean;
}

export function ChatHeader({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  activeChatId,
  onSelectChat,
  onNewChat,
  isLibraryPageActive,
  setIsLibraryPageActive,
  selectedModelId,
  setSelectedModelId,
  isLoading,
  apiKeys,
  mounted
}: ChatHeaderProps) {
  const { isSearchActive, setIsSearchActive, isSettingsActive, setIsSettingsActive } = useSidebarContext();

  return (
    <header className="fixed top-[calc(1.25rem+env(safe-area-inset-top,0px))] left-0 right-0 z-40 transition-all duration-300 pointer-events-none px-6">
      <div className="w-full flex items-center justify-between gap-4 relative">
        {/* Left Pill: Sidebar trigger + New Chat */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-full liquid-glass-dock h-11 md:h-12 shrink-0">
          {isSettingsActive ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:inline-flex h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 hover:scale-105 active:scale-[0.93] active:duration-75 transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out items-center justify-center text-foreground/80 hover:text-foreground"
              onClick={() => setIsSettingsActive(false)}
              title="Back to chat"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:inline-flex h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 hover:scale-105 active:scale-[0.93] active:duration-75 transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out items-center justify-center text-foreground/80 hover:text-foreground"
              onClick={() => {
                setIsSidebarCollapsed(false);
                localStorage.setItem('sidebar-collapsed', 'false');
              }}
              title="Open sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: 'currentColor' }}>
                <rect y="4.5" width="16" height="2" rx="1" fill="currentColor" />
                <rect y="9.5" width="11" height="2" rx="1" fill="currentColor" />
              </svg>
            </Button>
          )}

          {isSettingsActive ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="inline-flex md:hidden h-9 w-9 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 hover:scale-105 active:scale-[0.93] active:duration-75 transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out items-center justify-center text-foreground/80 hover:text-foreground"
              onClick={() => setIsSettingsActive(false)}
              title="Back to chat"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="inline-flex md:hidden h-9 w-9 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 hover:scale-105 active:scale-[0.93] active:duration-75 transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out items-center justify-center text-foreground/80 hover:text-foreground">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: 'currentColor' }}>
                    <rect y="4.5" width="16" height="2" rx="1" fill="currentColor" />
                    <rect y="9.5" width="11" height="2" rx="1" fill="currentColor" />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-0 bg-background/90 backdrop-blur-lg">
              <SheetTitle className="sr-only">Sidebar Navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Allows user to switch chats and select options
              </SheetDescription>
              <Sidebar 
                activeChatId={activeChatId}
                onSelectChat={(id) => {
                  onSelectChat(id);
                  setIsMobileSidebarOpen(false);
                }}
                onNewChat={() => {
                  onNewChat();
                  setIsMobileSidebarOpen(false);
                }}
                isSearchActive={isSearchActive}
                onSearchClick={() => {
                  setIsSearchActive(!isSearchActive);
                  setIsMobileSidebarOpen(false);
                }}
                isLibraryActive={isLibraryPageActive}
                onLibraryClick={() => {
                  setIsLibraryPageActive(!isLibraryPageActive);
                  setIsSearchActive(false);
                  setIsMobileSidebarOpen(false);
                }}
                isSettingsActive={isSettingsActive}
                onSettingsClick={() => {
                  setIsSettingsActive(!isSettingsActive);
                  setIsSearchActive(false);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full h-full border-r-0 bg-transparent backdrop-blur-none"
              />
            </SheetContent>
          </Sheet>
          )}
          <Button
            onClick={onNewChat}
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 hover:scale-105 active:scale-[0.93] active:duration-75 transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out text-foreground/80 hover:text-foreground flex items-center justify-center"
            title="New chat"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5"><path d="M11.4875 0.512563C10.804 -0.170854 9.696 -0.170854 9.01258 0.512563L4.75098 4.77417C4.49563 5.02951 4.29308 5.33265 4.15488 5.66628L3.30712 7.71282C3.19103 7.99307 3.25519 8.31566 3.46968 8.53017C3.68417 8.74467 4.00676 8.80885 4.28702 8.69277L6.33382 7.84501C6.66748 7.70681 6.97066 7.50423 7.22604 7.24886L11.4875 2.98744C12.1709 2.30402 12.1709 1.19598 11.4875 0.512563Z" fill="currentColor"></path><path d="M2.75 1.5C2.05964 1.5 1.5 2.05964 1.5 2.75V9.25C1.5 9.94036 2.05964 10.5 2.75 10.5H9.25C9.94036 10.5 10.5 9.94036 10.5 9.25V7C10.5 6.58579 10.8358 6.25 11.25 6.25C11.6642 6.25 12 6.58579 12 7V9.25C12 10.7688 10.7688 12 9.25 12H2.75C1.23122 12 0 10.7688 0 9.25V2.75C0 1.23122 1.23122 4.84288e-08 2.75 4.84288e-08H5C5.41421 4.84288e-08 5.75 0.335786 5.75 0.75C5.75 1.16421 5.41421 1.5 5 1.5H2.75Z" fill="currentColor"></path></svg>
          </Button>
        </div>

        {/* Center Pill: Model Selector */}
        {!isSearchActive && !isSettingsActive && !isLibraryPageActive && (
          <div className="absolute right-0 left-auto translate-x-0 md:left-1/2 md:-translate-x-1/2 md:right-auto pointer-events-auto flex items-center justify-center rounded-full liquid-glass-dock p-1 h-11 md:h-12">
            <ModelSelector
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
              isLoading={isLoading}
              geminiApiKey={apiKeys.geminiApiKey}
              mistralApiKey={apiKeys.mistralApiKey}
              perplexityApiKey={apiKeys.perplexityApiKey}
              zenmuxApiKey={apiKeys.zenmuxApiKey}
              nvidiaApiKey={apiKeys.nvidiaApiKey}
              inceptionApiKey={apiKeys.inceptionApiKey}
              minimal={true}
              align="top"
            />
          </div>
        )}

        {/* Right Pill: Settings Dialog Trigger */}
        {!isSearchActive && !isLibraryPageActive && (
          <div className="hidden md:flex pointer-events-auto flex items-center gap-1.5 p-1 rounded-full liquid-glass-dock h-11 md:h-12">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-[0.93] active:duration-75 transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out",
                isSettingsActive 
                  ? "bg-zinc-200/60 dark:bg-zinc-800 text-foreground" 
                  : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 text-foreground/80 hover:text-foreground"
              )}
              onClick={() => {
                setIsSettingsActive(!isSettingsActive);
                setIsSearchActive(false);
              }}
              title={isSettingsActive ? "Close settings" : "Open settings"}
            >
              <Settings className="h-4.5 w-4.5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
