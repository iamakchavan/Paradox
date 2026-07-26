"use client";

import { createContext, useContext } from 'react';

export interface SidebarContextType {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
  isSettingsActive: boolean;
  setIsSettingsActive: (active: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  isSidebarCollapsed: true,
  setIsSidebarCollapsed: () => {},
  isMobileSidebarOpen: false,
  setIsMobileSidebarOpen: () => {},
  isSearchActive: false,
  setIsSearchActive: () => {},
  isSettingsActive: false,
  setIsSettingsActive: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);
