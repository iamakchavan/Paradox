"use client";

import { DeleteFileConfirmModal } from '@/components/chat/DeleteFileConfirmModal';
import type { LibraryActionsController } from './use-library-actions';

export function LibraryDeleteDialog({ actions }: { actions: LibraryActionsController }) {
  return (
    <DeleteFileConfirmModal
      isOpen={actions.deleteTarget !== null}
      onClose={actions.closeDelete}
      onConfirm={actions.confirmDelete}
      entryTitle={actions.deleteTarget?.name || ''}
    />
  );
}
