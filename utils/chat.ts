export const processThinkingContent = (content: string) => {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const thinkMatch = content.match(thinkRegex);
  if (!thinkMatch) return { thinking: null, mainContent: content };
  
  const thinking = thinkMatch[1].trim();
  const mainContent = content.replace(thinkRegex, '').trim();
  
  return { thinking, mainContent };
}; 