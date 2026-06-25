import { motion } from 'framer-motion';
import { ReactNode, memo } from 'react';

interface MessageAnimatorProps {
  children: ReactNode;
  role: 'user' | 'assistant';
  isNew: boolean;
}

function MessageAnimatorComponent({ children, role, isNew }: MessageAnimatorProps) {
  if (!isNew) {
    return <div className="w-full">{children}</div>;
  }

  // Apple-like tight spring curve
  const springTransition = {
    type: 'spring',
    stiffness: 480,
    damping: 38,
    mass: 0.95
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 28, 
        scale: 0.96 
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1 
      }}
      transition={springTransition}
      style={{ 
        originX: role === 'user' ? 1 : 0,
        originY: 0.5 
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

export const MessageAnimator = memo(MessageAnimatorComponent);
