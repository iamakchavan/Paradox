import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterProps {
  text: string;
  onComplete?: () => void;
  className?: string;
}

export function Typewriter({ text, onComplete, className }: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50); // Adjust speed here (lower = faster)

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return (
    <div className={cn("font-mono", className)}>
      {displayText}
      <span className="animate-pulse">_</span>
    </div>
  );
} 