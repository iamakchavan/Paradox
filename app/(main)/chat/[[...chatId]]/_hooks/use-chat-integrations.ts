"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/lib/db';

const storageKey = (chatId: string) => `paradox_active_mcp_${chatId}`;

export function useChatIntegrations(chatId: string | null) {
  const [selectedMcpIds, setSelectedMcpIds] = useState<string[]>([]);
  const selectedMcpIdsRef = useRef(selectedMcpIds);

  useEffect(() => {
    selectedMcpIdsRef.current = selectedMcpIds;
  }, [selectedMcpIds]);

  useEffect(() => {
    const loadSelectedMcps = async () => {
      const allEnabled = await db.mcpIntegrations.toArray()
        .then(list => list.filter(server => server.isEnabled).map(server => server.id))
        .catch(() => [] as string[]);

      if (chatId) {
        const stored = localStorage.getItem(storageKey(chatId));
        if (stored) {
          try {
            const parsed: unknown = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setSelectedMcpIds(parsed.filter((id): id is string => (
                typeof id === 'string' && allEnabled.includes(id)
              )));
              return;
            }
          } catch (error) {
            console.error('Failed to parse active MCPs:', error);
          }
        }
      }
      setSelectedMcpIds([]);
    };

    void loadSelectedMcps();
  }, [chatId]);

  const handleToggleMcpId = useCallback((id: string) => {
    setSelectedMcpIds(previous => {
      const next = previous.includes(id)
        ? previous.filter(currentId => currentId !== id)
        : [...previous, id];
      if (chatId) {
        localStorage.setItem(storageKey(chatId), JSON.stringify(next));
      }
      return next;
    });
  }, [chatId]);

  const persistForChat = useCallback((nextChatId: string) => {
    localStorage.setItem(storageKey(nextChatId), JSON.stringify(selectedMcpIdsRef.current));
  }, []);

  return {
    selectedMcpIds,
    selectedMcpIdsRef,
    handleToggleMcpId,
    persistForChat,
  };
}

