import { GenerativeUIRegistry, GenerativeUIComponentType } from '@/components/chat/generative-ui/registry';

export interface GenerativeUIBlock {
  type: 'text' | 'component';
  content: string; // The raw string block
  componentName?: GenerativeUIComponentType;
  props?: Record<string, any>;
}

/**
 * Parses a string content stream into text blocks and generative UI components.
 * Safe for real-time stream processing.
 */
export function parseGenerativeUIContent(content: string): {
  blocks: GenerativeUIBlock[];
  cleanText: string;
} {
  const blocks: GenerativeUIBlock[] = [];
  let cleanText = '';
  
  // Regex to detect [ComponentName attr1="val1" ...] with safe end-of-string match for streaming
  const componentRegex = /\[([A-Z][a-zA-Z0-9]+)([^\]]*)(?:\/?\]|$)/g;
  
  let lastIndex = 0;
  let match;

  while ((match = componentRegex.exec(content)) !== null) {
    const compName = match[1];
    
    // Check if the component exists in our registry
    if (compName in GenerativeUIRegistry) {
      // 1. Add text before the component block
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore) {
        blocks.push({ type: 'text', content: textBefore });
        cleanText += textBefore;
      }

      // 2. Parse attributes
      const attrString = match[2];
      const props: Record<string, any> = {};
      
      // Matches key="value" or key='value' or key=value or key="partial
      const attrRegex = /([a-zA-Z0-9_-]+)=(?:"([^"]*)"?|'([^']*)'?|([^\s]+))/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        const key = attrMatch[1];
        // Take the first non-undefined match value
        const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
        props[key] = val;
      }

      blocks.push({
        type: 'component',
        content: match[0],
        componentName: compName as GenerativeUIComponentType,
        props,
      });

      lastIndex = componentRegex.lastIndex;
    }
  }

  // Add remaining text
  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    blocks.push({ type: 'text', content: remainingText });
    cleanText += remainingText;
  }

  return { blocks, cleanText };
}
