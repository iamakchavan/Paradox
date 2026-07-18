export const ANSWER_FONT_STORAGE_KEY = 'paradox-answer-font';

export const ANSWER_FONTS = ['sans', 'serif'] as const;

export type AnswerFont = (typeof ANSWER_FONTS)[number];

export function isAnswerFont(value: unknown): value is AnswerFont {
  return typeof value === 'string' && ANSWER_FONTS.includes(value as AnswerFont);
}

