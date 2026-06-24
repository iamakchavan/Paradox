export const processThinkingContent = (content: string) => {
  let thinking = '';
  let mainContent = content;

  let normalizedContent = content;
  if (content.includes('</think>') && !content.includes('<think>')) {
    normalizedContent = '<think>' + content;
  }

  const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
  let match;
  const thoughts: string[] = [];
  
  while ((match = thinkRegex.exec(normalizedContent)) !== null) {
    thoughts.push(match[1].trim());
  }

  const lastThinkStart = normalizedContent.lastIndexOf('<think>');
  const lastThinkEnd = normalizedContent.lastIndexOf('</think>');
  
  if (lastThinkStart !== -1 && (lastThinkEnd === -1 || lastThinkEnd < lastThinkStart)) {
    const ongoingThought = normalizedContent.substring(lastThinkStart + 7).trim();
    const searchTagIdx = ongoingThought.search(/<(search-loading|search-results)/);
    if (searchTagIdx !== -1) {
      thoughts.push(ongoingThought.substring(0, searchTagIdx).trim());
      mainContent = normalizedContent.substring(0, lastThinkStart) + ongoingThought.substring(searchTagIdx);
    } else {
      thoughts.push(ongoingThought);
      mainContent = normalizedContent.substring(0, lastThinkStart);
    }
  } else {
    mainContent = normalizedContent;
  }

  mainContent = mainContent.replace(thinkRegex, '').trim();
  thinking = thoughts.join('\n\n').trim();

  return { thinking: thinking || null, mainContent };
}; 