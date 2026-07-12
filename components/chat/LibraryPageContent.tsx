"use client";

import { LibraryDeleteDialog } from './library/LibraryDeleteDialog';
import { LibraryGrid } from './library/LibraryGrid';
import { LibraryLightbox } from './library/LibraryLightbox';
import { LibraryToolbar } from './library/LibraryToolbar';
import type { LibraryPageContentProps } from './library/types';
import { useLibraryActions } from './library/use-library-actions';
import { useLibraryBrowser } from './library/use-library-browser';

export { LibraryCard } from './library/LibraryCard';

export function LibraryPageContent({ onSelectChat }: LibraryPageContentProps) {
  const browser = useLibraryBrowser();
  const actions = useLibraryActions(onSelectChat);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col select-none pb-24">
      <LibraryToolbar browser={browser} />
      <LibraryGrid browser={browser} actions={actions} />
      <LibraryLightbox
        image={actions.activeLightboxImage}
        onClose={actions.closeLightbox}
        onDownload={actions.download}
      />
      <LibraryDeleteDialog actions={actions} />
    </div>
  );
}
