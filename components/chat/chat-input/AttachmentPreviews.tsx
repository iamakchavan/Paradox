"use client";

import { FileText, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { motionTransitions } from '@/lib/motion';

export function AttachmentPreviews({
  images,
  pdfs,
  removeImage,
  removePDF,
}: {
  images: string[];
  pdfs: { name: string; data: string }[];
  removeImage: (index: number) => void;
  removePDF: (index: number) => void;
}) {
  return (
    <>
      <AnimatePresence initial={false}>
        {images.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionTransitions.content}
            style={{ overflow: 'hidden' }}
            className="flex gap-2.5 px-5 pt-4 pb-1.5 overflow-x-auto scrollbar-none border-b border-border/30 rounded-t-[28px] bg-secondary/5"
          >
            {images.map((image, index) => (
              <motion.div
                key={`${image.substring(0, 80)}_${index}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={motionTransitions.item}
                className="relative shrink-0 group/image"
              >
                <img
                  src={image}
                  alt={`Selected ${index + 1}`}
                  className="object-cover rounded-lg border shadow-sm transition-transform duration-200 group-hover/image:scale-[0.98] group-hover/image:opacity-[0.98] w-14 h-14 sm:w-16 sm:h-16"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-1.5 -right-1.5 bg-background/95 rounded-full p-1 shadow-md border opacity-0 scale-75 group-hover/image:opacity-100 group-hover/image:scale-100 transition-[background-color,transform,opacity] duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] motion-reduce:transform-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {pdfs.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionTransitions.content}
            style={{ overflow: 'hidden' }}
            className="flex gap-2.5 px-5 pt-4 pb-1.5 overflow-x-auto scrollbar-none border-b border-border/30 rounded-t-[28px] bg-secondary/5"
          >
            {pdfs.map((pdf, index) => (
              <motion.div
                key={`${pdf.name}_${index}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={motionTransitions.item}
                className="relative shrink-0 group/pdf"
              >
                <div className="flex items-center gap-3 bg-secondary/20 rounded-lg px-4 py-2.5 border border-border/50 transition-colors duration-200 group-hover/pdf:bg-secondary/30">
                  <div className="w-8 h-8 flex items-center justify-center bg-primary/5 rounded-md">
                    <FileText className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-medium truncate max-w-[140px]">{pdf.name}</span>
                    <span className="text-[10px] text-muted-foreground">PDF Document</span>
                  </div>
                  <button
                    onClick={() => removePDF(index)}
                    className="ml-2 p-1 hover:bg-secondary/50 rounded-full transition-[background-color,transform,opacity] duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] opacity-0 scale-75 group-hover/pdf:opacity-100 group-hover/pdf:scale-100 motion-reduce:transform-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

