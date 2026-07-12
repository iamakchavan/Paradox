"use client";

import { useState } from 'react';
import { useCustomToast } from '@/components/ui/custom-toast';
import { deleteLibraryFile } from '@/hooks/use-library';
import type { LibraryDeleteTarget } from './types';

export function useLibraryActions(onSelectChat: (chatId: string) => void) {
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryDeleteTarget | null>(null);
  const { showToast } = useCustomToast();

  const download = (data: string, name: string) => {
    const link = document.createElement('a');
    link.href = data;
    link.download = name;
    link.click();
    showToast({
      message: 'Download started',
      type: 'success',
      mode: 'capsule',
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    await deleteLibraryFile(deleteTarget.id);
    showToast({
      message: 'File deleted from library',
      type: 'success',
      mode: 'capsule',
    });
    setDeleteTarget(null);
  };

  return {
    activeLightboxImage,
    deleteTarget,
    download,
    jumpToChat: onSelectChat,
    openLightbox: setActiveLightboxImage,
    closeLightbox: () => setActiveLightboxImage(null),
    requestDelete: (id: number, name: string) => setDeleteTarget({ id, name }),
    closeDelete: () => setDeleteTarget(null),
    confirmDelete,
  };
}

export type LibraryActionsController = ReturnType<typeof useLibraryActions>;
