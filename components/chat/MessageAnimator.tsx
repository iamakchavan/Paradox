import { motion } from 'framer-motion';
import { ReactNode, memo } from 'react';
import { motionTransitions } from '@/lib/motion';

interface MessageAnimatorProps {
  children: ReactNode;
  isNew: boolean;
}

function MessageAnimatorComponent({ children, isNew }: MessageAnimatorProps) {
  if (!isNew) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransitions.content}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

export const MessageAnimator = memo(MessageAnimatorComponent);
