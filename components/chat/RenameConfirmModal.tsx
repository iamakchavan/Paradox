import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Edit3, Check, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface RenameConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newTitle: string) => void;
  currentTitle: string;
}

// Detect mobile devices for performance-optimized transitions
const isMobileDevice = typeof window !== 'undefined' && (
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  window.innerWidth < 768
);

const spring = isMobileDevice
  ? { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.28 }
  : { type: 'spring', stiffness: 500, damping: 40, mass: 0.8 };

const springMed = isMobileDevice
  ? { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.32 }
  : { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 };

export function RenameConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  currentTitle,
}: RenameConfirmModalProps) {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(currentTitle);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onConfirm(title.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
          <DialogPrimitive.Portal forceMount>

            {/* Backdrop Overlay */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 50,
                  background: 'rgba(0, 0, 0, 0.5)',
                }}
              />
            </DialogPrimitive.Overlay>

            {/* Bottom Drawer / Modal Content Container */}
            <DialogPrimitive.Content asChild>
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.85 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 100 || info.velocity.y > 300) {
                    onClose();
                  }
                }}
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={springMed}
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 51,
                  background: 'hsl(var(--background))',
                  borderRadius: isMobile ? '24px 24px 0 0' : '32px 32px 0 0',
                  boxShadow: '0 -12px 60px rgba(0,0,0,0.15)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  maxWidth: 520,
                  margin: '0 auto',
                  paddingBottom: 'env(safe-area-inset-bottom, 24px)',
                  maxHeight: isMobile ? '85vh' : '90vh',
                  overflowY: 'auto',
                  border: isMobile ? 'none' : '1px solid hsl(var(--border) / 0.4)',
                  borderBottom: 'none',
                }}
              >
                {/* Drag handle for mobile gesture recognition */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 2 }}>
                  <div style={{ width: 38, height: 5, borderRadius: 99, background: 'hsl(var(--muted-foreground)/0.2)', cursor: 'grab' }} />
                </div>

                <form onSubmit={handleSubmit} style={{ padding: isMobile ? '10px 16px 16px' : '10px 24px 24px', position: 'relative' }}>
                  {/* Close button */}
                  <DialogPrimitive.Close asChild>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: isMobile ? 16 : 20,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'hsl(var(--muted))',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    >
                      <X size={16} />
                    </motion.button>
                  </DialogPrimitive.Close>

                  {/* Header Title & Subtext */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.04 }}
                    style={{ marginBottom: isMobile ? 16 : 20 }}
                  >
                    <div style={{
                      width: isMobile ? 44 : 56,
                      height: isMobile ? 44 : 56,
                      borderRadius: 99,
                      background: 'hsl(var(--foreground) / 0.05)',
                      color: 'hsl(var(--foreground) / 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: isMobile ? 12 : 16,
                    }}>
                      <Edit3 size={isMobile ? 20 : 24} />
                    </div>
                    <DialogPrimitive.Title style={{
                      fontSize: isMobile ? 20 : 26,
                      fontWeight: 600,
                      color: 'hsl(var(--foreground))',
                      letterSpacing: '-0.6px',
                      lineHeight: 1.25,
                      marginBottom: isMobile ? 4 : 6,
                    }}>
                      Rename Chat
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description style={{ fontSize: isMobile ? 12.5 : 14, color: 'hsl(var(--muted-foreground))', lineHeight: 1.45 }}>
                      Provide a new, descriptive title for this conversation.
                    </DialogPrimitive.Description>
                  </motion.div>

                  {/* Input field */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={spring}
                    style={{ marginBottom: isMobile ? 16 : 24 }}
                  >
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Enter chat title..."
                      autoFocus
                      className="w-full h-12 px-4 rounded-xl border border-foreground/[0.08] focus:border-foreground/30 bg-foreground/[0.02] dark:bg-foreground/[0.01] text-foreground placeholder:text-foreground/30 focus:outline-none transition-all duration-150 text-[14px]"
                    />
                  </motion.div>

                  {/* Actions CTA buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: 0.12 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10 }}
                  >
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.975 }}
                      transition={spring}
                      style={{
                        width: '100%',
                        height: isMobile ? 48 : 56,
                        borderRadius: 99,
                        background: 'hsl(var(--primary))',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: isMobile ? 13 : 14,
                        fontWeight: 600,
                        color: 'hsl(var(--primary-foreground))',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'hsl(var(--primary) / 0.9)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'hsl(var(--primary))';
                      }}
                    >
                      <Check size={isMobile ? 15 : 16} />
                      Save Title
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileTap={{ scale: 0.97 }}
                      transition={spring}
                      style={{
                        width: '100%',
                        height: isMobile ? 48 : 56,
                        borderRadius: 99,
                        background: 'hsl(var(--muted))',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: isMobile ? 13 : 14,
                        fontWeight: 600,
                        color: 'hsl(var(--foreground))',
                        fontFamily: 'inherit',
                      }}
                    >
                      Cancel
                    </motion.button>
                  </motion.div>

                </form>
              </motion.div>
            </DialogPrimitive.Content>

          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}
