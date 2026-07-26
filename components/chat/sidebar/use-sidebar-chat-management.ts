"use client";

import { useMemo, useState } from 'react';
import { useCustomToast } from '@/components/ui/custom-toast';
import { deleteChatSession, renameChatSession } from '@/hooks/use-chat-history';
import type { ChatSession } from '@/lib/db';

export function useSidebarChatManagement({
  activeChatId,
  chats,
  onActiveChatDeleted,
}: {
  activeChatId: string | null;
  chats: ChatSession[] | undefined;
  onActiveChatDeleted: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useCustomToast();

  const deleteTargetTitle = useMemo(() => {
    if (!deleteTargetId || !chats) return '';
    return chats.find((chat) => chat.id === deleteTargetId)?.title ?? '';
  }, [deleteTargetId, chats]);

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    await deleteChatSession(deleteTargetId);
    showToast({
      message: 'Conversation deleted',
      type: 'success',
      mode: 'capsule',
    });
    if (activeChatId === deleteTargetId) {
      onActiveChatDeleted();
    }
    setDeleteTargetId(null);
  };

  const confirmRename = async (newTitle: string) => {
    if (!editingId) return;

    await renameChatSession(editingId, newTitle);
    showToast({
      message: 'Conversation renamed',
      type: 'success',
      mode: 'capsule',
    });
    setEditingId(null);
  };

  return {
    editingId,
    editTitle,
    deleteTargetId,
    deleteTargetTitle,
    startRename,
    requestDelete,
    confirmDelete,
    confirmRename,
    closeDelete: () => setDeleteTargetId(null),
    closeRename: () => setEditingId(null),
  };
}

export type SidebarChatManagementController = ReturnType<typeof useSidebarChatManagement>;
