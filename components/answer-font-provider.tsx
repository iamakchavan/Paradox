"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ANSWER_FONT_STORAGE_KEY,
  isAnswerFont,
  type AnswerFont,
} from '@/lib/answer-font';

interface AnswerFontContextValue {
  answerFont: AnswerFont;
  setAnswerFont: (font: AnswerFont) => void;
}

const DEFAULT_ANSWER_FONT: AnswerFont = 'sans';
const AnswerFontContext = createContext<AnswerFontContextValue | null>(null);

function applyAnswerFont(font: AnswerFont) {
  document.documentElement.dataset.answerFont = font;
}

function readStoredAnswerFont(): AnswerFont {
  try {
    const stored = window.localStorage.getItem(ANSWER_FONT_STORAGE_KEY);
    return isAnswerFont(stored) ? stored : DEFAULT_ANSWER_FONT;
  } catch {
    return DEFAULT_ANSWER_FONT;
  }
}

export function AnswerFontProvider({ children }: { children: ReactNode }) {
  const [answerFont, setAnswerFontState] = useState<AnswerFont>(DEFAULT_ANSWER_FONT);

  useLayoutEffect(() => {
    const storedFont = readStoredAnswerFont();
    applyAnswerFont(storedFont);
    setAnswerFontState(storedFont);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ANSWER_FONT_STORAGE_KEY) return;
      const nextFont = isAnswerFont(event.newValue) ? event.newValue : DEFAULT_ANSWER_FONT;
      applyAnswerFont(nextFont);
      setAnswerFontState(nextFont);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setAnswerFont = useCallback((font: AnswerFont) => {
    applyAnswerFont(font);
    setAnswerFontState(font);
    try {
      window.localStorage.setItem(ANSWER_FONT_STORAGE_KEY, font);
    } catch {
      // The in-memory preference still applies when storage is unavailable.
    }
  }, []);

  const value = useMemo(
    () => ({ answerFont, setAnswerFont }),
    [answerFont, setAnswerFont],
  );

  return (
    <AnswerFontContext.Provider value={value}>
      {children}
    </AnswerFontContext.Provider>
  );
}

export function useAnswerFont() {
  const context = useContext(AnswerFontContext);
  if (!context) {
    throw new Error('useAnswerFont must be used within AnswerFontProvider');
  }
  return context;
}

