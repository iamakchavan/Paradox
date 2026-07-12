"use client";

import { FolderOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LibraryActionsController } from './use-library-actions';
import type { LibraryBrowserController } from './use-library-browser';
import { LibraryCard } from './LibraryCard';

interface LibraryGridProps {
  browser: LibraryBrowserController;
  actions: LibraryActionsController;
}

export function LibraryGrid({ browser, actions }: LibraryGridProps) {
  const { files, hasMore, query, sentinelRef } = browser;

  return (
    <AnimatePresence mode="popLayout">
      {files === undefined ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2 text-[12px] text-foreground/30">
          <div className="w-4 h-4 border-2 border-foreground/20 border-t-transparent rounded-full animate-spin" />
          <span>Loading library...</span>
        </div>
      ) : files.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex flex-col items-center justify-center py-28 gap-4 border border-dashed border-foreground/[0.06] rounded-2xl bg-foreground/[0.005] dark:bg-transparent"
        >
          <FolderOpen className="w-8 h-8 text-foreground/20" strokeWidth={1.5} />
          <div className="text-center">
            <p className="text-[13px] font-medium text-foreground/50">No files found</p>
            <p className="text-[11.5px] text-foreground/30 mt-0.5">
              {query.trim()
                ? 'Try modifying your search text'
                : 'Files shared in your chats will appear here'}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          >
            {files.map((file) => (
              <LibraryCard
                key={file.id}
                file={file}
                onDownload={actions.download}
                onJumpToChat={actions.jumpToChat}
                onDelete={actions.requestDelete}
                onOpenLightbox={actions.openLightbox}
              />
            ))}
          </motion.div>
          {hasMore && (
            <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
              <div className="w-4 h-4 border-2 border-foreground/20 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
