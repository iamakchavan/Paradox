"use client";

import { createContext, useContext } from "react";

import type { AnswerSource } from "./SourceList";

interface SourcesPanelContextValue {
  sources: AnswerSource[];
  isOpen: boolean;
  toggleSources: (sources: AnswerSource[]) => void;
  closeSources: () => void;
}

export const SourcesPanelContext = createContext<SourcesPanelContextValue>({
  sources: [],
  isOpen: false,
  toggleSources: () => {},
  closeSources: () => {},
});

export const useSourcesPanel = () => useContext(SourcesPanelContext);
