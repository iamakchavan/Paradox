"use client";

import { Download, ExternalLink, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LibraryFile } from '@/lib/db';
import { useLibraryCardPayload } from './use-library-card-payload';

interface LibraryCardProps {
  file: LibraryFile;
  onDownload: (data: string, name: string) => void;
  onJumpToChat: (chatId: string) => void;
  onDelete: (id: number, name: string) => void;
  onOpenLightbox: (data: string) => void;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function LibraryCard({
  file,
  onDownload,
  onJumpToChat,
  onDelete,
  onOpenLightbox,
}: LibraryCardProps) {
  const { cardRef, dataUrl, imgSrc } = useLibraryCardPayload(file);

  return (
    <motion.div
      ref={cardRef}
      layoutId={`file-card-${file.id}`}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-foreground/[0.06] bg-foreground/[0.015] dark:bg-foreground/[0.005] hover:bg-foreground/[0.03] dark:hover:bg-foreground/[0.01] hover:border-foreground/[0.12] transition-[background-color,border-color] duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)]"
    >
      <div
        className="aspect-square relative w-full bg-foreground/[0.02] border-b border-foreground/[0.04] flex items-center justify-center cursor-zoom-in overflow-hidden"
        onClick={() => file.type === 'image' && imgSrc && onOpenLightbox(imgSrc)}
      >
        {file.type === 'image' ? (
          imgSrc ? (
            <img
              src={imgSrc}
              alt={file.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[var(--motion-duration-panel)] ease-[var(--motion-ease-out)] group-hover:scale-105 motion-reduce:transform-none"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/[0.02]">
              <div className="w-4 h-4 border-2 border-foreground/20 border-t-transparent rounded-full animate-spin" />
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-2 text-foreground/30">
            <FileText className="w-8 h-8 stroke-[1.25] text-red-500/80" />
            <span className="text-[10px] font-semibold bg-foreground/[0.04] px-1.5 py-0.5 rounded border border-foreground/[0.04]">PDF</span>
          </div>
        )}

        <div className="absolute inset-0 bg-background/50 dark:bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={(event) => {
              event.stopPropagation();
              if (dataUrl) onDownload(dataUrl, file.name);
            }}
            disabled={!dataUrl && file.type === 'image'}
            className="h-8 w-8 rounded-full bg-background hover:bg-foreground/[0.04] text-foreground/75 hover:text-foreground flex items-center justify-center transition-[background-color,color,opacity,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] active:scale-[0.97] motion-reduce:transform-none border border-foreground/[0.08] shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onJumpToChat(file.chatId);
            }}
            className="h-8 w-8 rounded-full bg-background hover:bg-foreground/[0.04] text-foreground/75 hover:text-foreground flex items-center justify-center transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] active:scale-[0.97] motion-reduce:transform-none border border-foreground/[0.08] shadow-sm cursor-pointer"
            title="Jump to Chat"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete(file.id!, file.name);
            }}
            className="h-8 w-8 rounded-full bg-background hover:bg-red-50/50 hover:text-red-600 text-foreground/45 flex items-center justify-center transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] active:scale-[0.97] motion-reduce:transform-none border border-foreground/[0.08] shadow-sm cursor-pointer"
            title="Delete from Library"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-0.5 min-w-0">
        <span className="truncate text-[11.5px] font-medium text-foreground/80" title={file.name}>
          {file.name}
        </span>
        <span className="text-[9.5px] text-foreground/40 font-normal">
          {formatDate(file.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}
