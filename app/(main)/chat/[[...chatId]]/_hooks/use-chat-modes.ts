"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

const SEARCH_STORAGE_KEY = 'search-enabled';
const RESEARCH_STORAGE_KEY = 'research-enabled';

export function useChatModes() {
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [researchEnabled, setResearchEnabled] = useState(false);
  const searchEnabledRef = useRef(false);
  const researchEnabledRef = useRef(false);

  useEffect(() => {
    const search = localStorage.getItem(SEARCH_STORAGE_KEY) === 'true';
    const research = localStorage.getItem(RESEARCH_STORAGE_KEY) === 'true';
    setSearchEnabled(search);
    setResearchEnabled(research);
    searchEnabledRef.current = search;
    researchEnabledRef.current = research;
  }, []);

  const handleToggleSearch = useCallback((enabled: boolean) => {
    setSearchEnabled(enabled);
    searchEnabledRef.current = enabled;
    localStorage.setItem(SEARCH_STORAGE_KEY, enabled ? 'true' : 'false');
    if (enabled) {
      setResearchEnabled(false);
      researchEnabledRef.current = false;
      localStorage.setItem(RESEARCH_STORAGE_KEY, 'false');
    }
  }, []);

  const handleToggleResearch = useCallback((enabled: boolean) => {
    setResearchEnabled(enabled);
    researchEnabledRef.current = enabled;
    localStorage.setItem(RESEARCH_STORAGE_KEY, enabled ? 'true' : 'false');
    if (enabled) {
      setSearchEnabled(false);
      searchEnabledRef.current = false;
      localStorage.setItem(SEARCH_STORAGE_KEY, 'false');
    }
  }, []);

  return {
    searchEnabled,
    researchEnabled,
    searchEnabledRef,
    researchEnabledRef,
    handleToggleSearch,
    handleToggleResearch,
  };
}

