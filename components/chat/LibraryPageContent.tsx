import { useState, useEffect, useRef } from 'react';
import { Search, X, FolderOpen, Download, Trash2, ExternalLink, FileText } from 'lucide-react';
import { useLibrary, deleteLibraryFile } from '@/hooks/use-library';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomToast } from '@/components/ui/custom-toast';
import { DeleteFileConfirmModal } from './DeleteFileConfirmModal';
import { db, type LibraryFile } from '@/lib/db';

interface LibraryPageContentProps {
  onSelectChat: (chatId: string) => void;
}

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/png';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

interface LibraryCardProps {
  file: LibraryFile;
  onDownload: (data: string, name: string, e: React.MouseEvent) => void;
  onJumpToChat: (chatId: string, e: React.MouseEvent) => void;
  onDelete: (id: number, name: string, e: React.MouseEvent) => void;
  onOpenLightbox: (data: string) => void;
}

export function LibraryCard({
  file,
  onDownload,
  onJumpToChat,
  onDelete,
  onOpenLightbox,
}: LibraryCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Load content slightly before it enters the viewport
    );

    const currentCard = cardRef.current;
    if (currentCard) {
      observer.observe(currentCard);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isVisible && file.id !== undefined && !imgSrc) {
      db.libraryPayloads.get(file.id).then((payload) => {
        if (payload) {
          setDataUrl(payload.data);
          if (file.type === 'image') {
            try {
              const blob = base64ToBlob(payload.data);
              const objectUrl = URL.createObjectURL(blob);
              setImgSrc(objectUrl);
            } catch (e) {
              console.error('Failed to convert base64 payload to object URL:', e);
              setImgSrc(payload.data); // Fallback to raw base64
            }
          } else {
            setImgSrc(payload.data);
          }
        }
      }).catch(err => {
        console.error('Failed to fetch library file payload:', file.id, err);
      });
    }
  }, [isVisible, file.id, imgSrc, file.type]);

  // Clean up Object URL to prevent memory leaks!
  useEffect(() => {
    return () => {
      if (imgSrc && imgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc);
      }
    };
  }, [imgSrc]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <motion.div
      ref={cardRef}
      layoutId={`file-card-${file.id}`}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-foreground/[0.06] bg-foreground/[0.015] dark:bg-foreground/[0.005] hover:bg-foreground/[0.03] dark:hover:bg-foreground/[0.01] hover:border-foreground/[0.12] transition-all duration-200"
    >
      {/* Preview Frame */}
      <div
        className="aspect-square relative w-full bg-foreground/[0.02] border-b border-foreground/[0.04] flex items-center justify-center cursor-zoom-in overflow-hidden"
        onClick={() => file.type === 'image' && imgSrc && onOpenLightbox(imgSrc)}
      >
        {file.type === 'image' ? (
          imgSrc ? (
            <img
              src={imgSrc}
              alt={file.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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

        {/* Hover Overlay Action Bar */}
        <div className="absolute inset-0 bg-background/50 dark:bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={(e) => dataUrl && onDownload(dataUrl, file.name, e)}
            disabled={!dataUrl && file.type === 'image'}
            className="h-8 w-8 rounded-full bg-background hover:bg-foreground/[0.04] text-foreground/75 hover:text-foreground flex items-center justify-center transition-all duration-150 border border-foreground/[0.08] shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onJumpToChat(file.chatId, e)}
            className="h-8 w-8 rounded-full bg-background hover:bg-foreground/[0.04] text-foreground/75 hover:text-foreground flex items-center justify-center transition-all duration-150 border border-foreground/[0.08] shadow-sm cursor-pointer"
            title="Jump to Chat"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onDelete(file.id!, file.name, e)}
            className="h-8 w-8 rounded-full bg-background hover:bg-red-50/50 hover:text-red-600 text-foreground/45 flex items-center justify-center transition-all duration-150 border border-foreground/[0.08] shadow-sm cursor-pointer"
            title="Delete from Library"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Details Footer */}
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

export function LibraryPageContent({ onSelectChat }: LibraryPageContentProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'pdf'>('all');
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const { showToast } = useCustomToast();

  const allFiles = useLibrary(query, typeFilter);
  const [visibleLimit, setVisibleLimit] = useState(16);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const files = allFiles?.slice(0, visibleLimit);
  const hasMore = allFiles ? allFiles.length > visibleLimit : false;

  useEffect(() => {
    setVisibleLimit(16);
  }, [query, typeFilter]);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleLimit((prev) => prev + 16);
        }
      },
      { threshold: 0.1 }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore]);

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({ id, name });
  };

  const handleDownload = (data: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleJumpToChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectChat(chatId);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col select-none pb-24">
      {/* Header section */}
      <div className="flex flex-col gap-1.5 mb-8">
        <h1 className="text-[20px] font-semibold tracking-tight text-foreground/90 leading-none">
          Library
        </h1>
        <p className="text-[12.5px] text-foreground/45 leading-normal">
          Browse and download files uploaded across all your conversation histories.
        </p>
      </div>

      {/* Controls Row: Search + Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-foreground/30" />
          <input
            type="text"
            placeholder="Search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 bg-foreground/[0.02] dark:bg-foreground/[0.01] border border-foreground/[0.08] focus:border-foreground/30 rounded-lg text-[13px] focus:outline-none transition-all duration-150 placeholder:text-foreground/30 text-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-3 text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-foreground/[0.03] dark:bg-foreground/[0.015] border border-foreground/[0.04] p-0.5 rounded-lg text-[12px] font-medium text-foreground/50 self-start sm:self-auto">
          {(['all', 'image', 'pdf'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTypeFilter(filter)}
              className={`px-3 py-1 rounded-md transition-all duration-200 cursor-pointer ${
                typeFilter === filter
                  ? 'bg-background text-foreground/90 shadow-sm font-semibold'
                  : 'hover:text-foreground/80'
              }`}
            >
              {filter === 'all' && 'All'}
              {filter === 'image' && 'Images'}
              {filter === 'pdf' && 'Documents'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Content */}
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
                  onDownload={handleDownload}
                  onJumpToChat={handleJumpToChat}
                  onDelete={handleDelete}
                  onOpenLightbox={setActiveLightboxImage}
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

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {activeLightboxImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 select-none cursor-zoom-out animate-in fade-in duration-200"
            onClick={() => setActiveLightboxImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-[90vw] max-h-[90vh] pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={activeLightboxImage}
                alt="Preview"
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={(e) => handleDownload(activeLightboxImage, `Paradox_Image_${Date.now()}.png`, e)}
                  className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white cursor-pointer transition-all duration-150"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveLightboxImage(null)}
                  className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white cursor-pointer transition-all duration-150"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteFileConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteLibraryFile(deleteTarget.id);
            showToast({
              message: 'File deleted from library',
              type: 'success',
              mode: 'capsule',
            });
            setDeleteTarget(null);
          }
        }}
        entryTitle={deleteTarget?.name || ''}
      />
    </div>
  );
}
