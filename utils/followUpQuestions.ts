import { streamGenerateContent } from '@/lib/gemini';

export const generateFollowUpQuestions = async (content: string): Promise<string[]> => {
  try {
    let streamedText = '';
    const prompt = `Based on the previous answer: "${content.slice(0, 500)}...", generate 4 insightful follow-up questions that would lead to deeper understanding or practical applications of the topic. Make questions natural and conversational. Return ONLY the questions, each on a new line, no numbering or additional text.`;
    
    // Always use Gemini API regardless of mode
    await streamGenerateContent(
      prompt,
      [{ role: 'user', content: prompt }],
      (token) => {
        streamedText += token;
      }
    );
    
    // Only filter out empty lines and limit to 4 questions
    return streamedText.split('\n')
      .filter(q => q.trim())
      .slice(0, 4);
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return [];
  }
}; 