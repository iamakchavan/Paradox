export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  pdfs?: { name: string; data: string }[];
}

/**
 * Optimizes conversational history payload for Next.js API delivery.
 * 
 * Production standards applied:
 * 1. Slices history to the last N messages (default: 20) to maintain deep conversational memory.
 * 2. Strips heavy Base64 image and PDF data from history items older than the recent window (default: 4) to conserve network upload bandwidth.
 * 3. Strips `<think>...</think>` internal reasoning logs from older assistant replies to reduce input token overhead.
 * 
 * @param conversation The complete array of messages from client-side state.
 * @param maxMessages Maximum number of past messages to send for textual context.
 * @param recentWindow Number of recent messages that retain active media files.
 */
export function pruneChatHistory(
  conversation: ChatMessagePayload[],
  maxMessages = 20,
  recentWindow = 4
): ChatMessagePayload[] {
  if (!conversation || conversation.length === 0) return [];

  // Slice history to the last maxMessages
  const sliced = conversation.slice(-maxMessages);
  const recentThreshold = sliced.length - recentWindow;

  return sliced.map((msg, idx) => {
    const isRecent = idx >= recentThreshold;
    let content = msg.content;

    // Prune assistant internal thoughts from older history to optimize token consumption
    if (!isRecent && msg.role === 'assistant' && content.includes('</think>')) {
      let temp = content;
      if (!temp.includes('<think>')) {
        temp = '<think>' + temp;
      }
      content = temp.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }

    return {
      role: msg.role,
      content,
      // Strip heavy media assets from older turns, leaving them only in the immediate window
      images: isRecent ? msg.images : undefined,
      pdfs: isRecent ? msg.pdfs : undefined,
    };
  });
}
