"use client";

import { Download, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface LibraryLightboxProps {
  image: string | null;
  onClose: () => void;
  onDownload: (data: string, name: string) => void;
}

export function LibraryLightbox({ image, onClose, onDownload }: LibraryLightboxProps) {
  return (
    <AnimatePresence>
      {image && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 select-none cursor-zoom-out animate-in fade-in duration-200"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-[90vw] max-h-[90vh] pointer-events-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={image}
              alt="Preview"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDownload(image, `Paradox_Image_${Date.now()}.png`);
                }}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white cursor-pointer transition-all duration-150"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
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
  );
}
