"use client";

import { DeleteConfirmModal } from '@/components/chat/DeleteConfirmModal';
import { RenameConfirmModal } from '@/components/chat/RenameConfirmModal';
import type { SidebarChatManagementController } from './use-sidebar-chat-management';

export function SidebarChatDialogs({
  management,
}: {
  management: SidebarChatManagementController;
}) {
  return (
    <>
      <DeleteConfirmModal
        isOpen={management.deleteTargetId !== null}
        onClose={management.closeDelete}
        onConfirm={management.confirmDelete}
        entryTitle={management.deleteTargetTitle}
      />

      <RenameConfirmModal
        isOpen={management.editingId !== null}
        onClose={management.closeRename}
        onConfirm={management.confirmRename}
        currentTitle={management.editTitle}
      />
    </>
  );
}
