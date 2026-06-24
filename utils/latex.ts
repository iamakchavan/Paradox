export const preprocessLaTeX = (content: string) => {
  if (!content) return "";
  
  let processed = content;
  
  // 1. Replace \[ ... \] with $$ ... $$ only if closed
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '\n\n$$$$\n$1\n$$$$\n\n');
  // 2. Replace \( ... \) with $ ... $ only if closed
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$1$');
  
  // 3. Replace standard [ math ] with $$ math $$ only if closed
  processed = processed.replace(/(?:^|\s)\[\s+([\s\S]*?)\s+\](?:\s|$)/g, (match, p1) => {
    if (p1 === ' ' || p1 === 'x' || p1 === 'X') {
      return match;
    }
    if (p1.startsWith('http') || p1.includes('](')) {
      return match;
    }
    return `\n\n$$\n${p1}\n$$\n\n`;
  });
  
  // 4. Replace ( math ) with $ math $ only if closed
  processed = processed.replace(/(?:^|\s)\(\s+([\s\S]*?)\s+\)(?:\s|$|\.)/g, (match, p1) => {
    const isSingleChar = /^[a-zA-Z0-9]$/.test(p1.trim());
    if (isSingleChar) {
      return ` $${p1.trim()}$ `;
    }
    if (p1.length < 10 && !p1.includes('\\') && !p1.includes('^') && !p1.includes('_') && !p1.includes('=') && !p1.includes('+') && !p1.includes('-') && !p1.includes('*') && !p1.includes('/')) {
      return match;
    }
    return ` $${p1}$ `;
  });

  // 5. Neutralize any unclosed $$ or $ delimiters at the end of the content to prevent streaming parse errors
  const blockMatches = processed.match(/\$\$/g);
  const blockCount = blockMatches ? blockMatches.length : 0;
  
  const tempText = processed.replace(/\$\$/g, '@@');
  const inlineMatches = tempText.match(/\$/g);
  const inlineCount = inlineMatches ? inlineMatches.length : 0;
  
  if (blockCount % 2 !== 0) {
    const lastIdx = processed.lastIndexOf('$$');
    if (lastIdx !== -1) {
      processed = processed.substring(0, lastIdx) + '\\$\\$' + processed.substring(lastIdx + 2);
    }
  }
  
  if (inlineCount % 2 !== 0) {
    const tempProcessed = processed.replace(/\$\$/g, '@@');
    const lastIdx = tempProcessed.lastIndexOf('$');
    if (lastIdx !== -1) {
      processed = processed.substring(0, lastIdx) + '\\$' + processed.substring(lastIdx + 1);
    }
  }
  
  return processed;
};
