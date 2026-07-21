"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const SEARCH_STORAGE_KEY = 'search-enabled';
const RESEARCH_STORAGE_KEY = 'research-enabled';

interface ChatModesContextValue {
  searchEnabled: boolean;
  researchEnabled: boolean;
  searchEnabledRef: { current: boolean };
  researchEnabledRef: { current: boolean };
  handleToggleSearch: (enabled: boolean) => void;
  handleToggleResearch: (enabled: boolean) => void;
}

const ChatModesContext = createContext<ChatModesContextValue | null>(null);

export function ChatModesProvider({ children }: { children: ReactNode }) {
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [researchEnabled, setResearchEnabled] = useState(false);
  const searchEnabledRef = useRef(false);
  const researchEnabledRef = useRef(false);

  useEffect(() => {
    const storedResearch = localStorage.getItem(RESEARCH_STORAGE_KEY) === 'true';
    const storedSearch = !storedResearch && localStorage.getItem(SEARCH_STORAGE_KEY) === 'true';

    setSearchEnabled(storedSearch);
    setResearchEnabled(storedResearch);
    searchEnabledRef.current = storedSearch;
    researchEnabledRef.current = storedResearch;
  }, []);

  const handleToggleSearch = useCallback((enabled: boolean) => {
    setSearchEnabled(enabled);
    searchEnabledRef.current = enabled;
    localStorage.setItem(SEARCH_STORAGE_KEY, String(enabled));

    if (enabled) {
      setResearchEnabled(false);
      researchEnabledRef.current = false;
      localStorage.setItem(RESEARCH_STORAGE_KEY, 'false');
    }
  }, []);

  const handleToggleResearch = useCallback((enabled: boolean) => {
    setResearchEnabled(enabled);
    researchEnabledRef.current = enabled;
    localStorage.setItem(RESEARCH_STORAGE_KEY, String(enabled));

    if (enabled) {
      setSearchEnabled(false);
      searchEnabledRef.current = false;
      localStorage.setItem(SEARCH_STORAGE_KEY, 'false');
    }
  }, []);

  const value = useMemo<ChatModesContextValue>(() => ({
    searchEnabled,
    researchEnabled,
    searchEnabledRef,
    researchEnabledRef,
    handleToggleSearch,
    handleToggleResearch,
  }), [
    searchEnabled,
    researchEnabled,
    handleToggleSearch,
    handleToggleResearch,
  ]);

  return (
    <ChatModesContext.Provider value={value}>
      {children}
    </ChatModesContext.Provider>
  );
}

export function useChatModesContext() {
  const context = useContext(ChatModesContext);
  if (!context) {
    throw new Error('useChatModesContext must be used within ChatModesProvider');
  }
  return context;
}
