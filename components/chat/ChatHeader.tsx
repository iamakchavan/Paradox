import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Sidebar } from '@/components/chat/sidebar';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { Settings } from 'lucide-react';
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
            <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: 'currentColor' }}><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M4.8 12C3.11984 12 2.27976 12 1.63803 11.673C1.07354 11.3854 0.614601 10.9265 0.32698 10.362C0 9.72024 0 8.88016 0 7.2V4.8C0 3.11984 0 2.27976 0.32698 1.63803C0.614601 1.07354 1.07354 0.614601 1.63803 0.32698C2.27976 0 3.11984 0 4.8 0H9.2C10.8802 0 11.7202 0 12.362 0.32698C12.9265 0.614601 13.3854 1.07354 13.673 1.63803C14 2.27976 14 3.11984 14 4.8V7.2C14 8.88016 14 9.72024 13.673 10.362C13.3854 10.9265 12.9265 11.3854 12.362 11.673C11.7202 12 10.8802 12 9.2 12H4.8ZM10.1 1.5C10.9401 1.5 11.3601 1.5 11.681 1.66349C11.9632 1.8073 12.1927 2.03677 12.3365 2.31901C12.5 2.63988 12.5 3.05992 12.5 3.9V8.1C12.5 8.94008 12.5 9.36012 12.3365 9.68099C12.1927 9.96323 11.9632 10.1927 11.681 10.3365C11.3601 10.5 10.9401 10.5 10.1 10.5H9.9C9.05992 10.5 8.63988 10.5 8.31901 10.3365C8.03677 10.1927 7.8073 9.96323 7.66349 9.68099C7.5 9.36012 7.5 8.94008 7.5 8.1V3.9C7.5 3.05992 7.5 2.63988 7.66349 2.31901C7.8073 2.03677 8.03677 1.8073 8.31901 1.66349C8.63988 1.5 9.05992 1.5 9.9 1.5H10.1ZM1.96094 2.82422C1.96094 2.47904 2.24076 2.19922 2.58594 2.19922H4.08594C4.43112 2.19922 4.71094 2.47904 4.71094 2.82422C4.71094 3.1694 4.43112 3.44922 4.08594 3.44922H2.58594C2.24076 3.44922 1.96094 3.1694 1.96094 2.82422ZM2.58594 4.19531C2.24076 4.19531 1.96094 4.47513 1.96094 4.82031C1.96094 5.16549 2.24076 5.44531 2.58594 5.44531H4.08594C4.43112 5.44531 4.71094 5.16549 4.71094 4.82031C4.71094 4.47513 4.43112 4.19531 4.08594 4.19531H2.58594Z"></path></svg>
          </Button>
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="inline-flex md:hidden h-9 w-9 rounded-full hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 hover:scale-105 active:scale-[0.93] active:duration-75 transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out items-center justify-center text-foreground/80 hover:text-foreground">
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" style={{ color: 'currentColor' }}><path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M4.8 12C3.11984 12 2.27976 12 1.63803 11.673C1.07354 11.3854 0.614601 10.9265 0.32698 10.362C0 9.72024 0 8.88016 0 7.2V4.8C0 3.11984 0 2.27976 0.32698 1.63803C0.614601 1.07354 1.07354 0.614601 1.63803 0.32698C2.27976 0 3.11984 0 4.8 0H9.2C10.8802 0 11.7202 0 12.362 0.32698C12.9265 0.614601 13.3854 1.07354 13.673 1.63803C14 2.27976 14 3.11984 14 4.8V7.2C14 8.88016 14 9.72024 13.673 10.362C13.3854 10.9265 12.9265 11.3854 12.362 11.673C11.7202 12 10.8802 12 9.2 12H4.8ZM10.1 1.5C10.9401 1.5 11.3601 1.5 11.681 1.66349C11.9632 1.8073 12.1927 2.03677 12.3365 2.31901C12.5 2.63988 12.5 3.05992 12.5 3.9V8.1C12.5 8.94008 12.5 9.36012 12.3365 9.68099C12.1927 9.96323 11.9632 10.1927 11.681 10.3365C11.3601 10.5 10.9401 10.5 10.1 10.5H9.9C9.05992 10.5 8.63988 10.5 8.31901 10.3365C8.03677 10.1927 7.8073 9.96323 7.66349 9.68099C7.5 9.36012 7.5 8.94008 7.5 8.1V3.9C7.5 3.05992 7.5 2.63988 7.66349 2.31901C7.8073 2.03677 8.03677 1.8073 8.31901 1.66349C8.63988 1.5 9.05992 1.5 9.9 1.5H10.1ZM1.96094 2.82422C1.96094 2.47904 2.24076 2.19922 2.58594 2.19922H4.08594C4.43112 2.19922 4.71094 2.47904 4.71094 2.82422C4.71094 3.1694 4.43112 3.44922 4.08594 3.44922H2.58594C2.24076 3.44922 1.96094 3.1694 1.96094 2.82422ZM2.58594 4.19531C2.24076 4.19531 1.96094 4.47513 1.96094 4.82031C1.96094 5.16549 2.24076 5.44531 2.58594 5.44531H4.08594C4.43112 5.44531 4.71094 5.16549 4.71094 4.82031C4.71094 4.47513 4.43112 4.19531 4.08594 4.19531H2.58594Z"></path></svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-0">
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
                className="w-full h-full border-r-0"
              />
            </SheetContent>
          </Sheet>
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
