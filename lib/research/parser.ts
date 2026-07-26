export interface ResearchStep {
  type: 'search' | 'browse' | 'x' | 'plan' | 'synthesis' | 'scrape' | 'map';
  status: 'started' | 'completed';
  query?: string;
  url?: string;
  results?: Array<{ title: string; url: string; content: string }>;
}

export function parseResearchStream(content: string): {
  steps: ResearchStep[];
  cleanContent: string;
} {
  const steps: ResearchStep[] = [];
  let cleanContent = content;

  // Regex to extract all search results
  const resultsRegex = /<search-results>([\s\S]*?)<\/search-results>/g;
  const resultsList: Array<Array<{ title: string; url: string; content: string }>> = [];
  let resultsMatch;
  while ((resultsMatch = resultsRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(resultsMatch[1]);
      if (Array.isArray(parsed)) {
        resultsList.push(parsed);
      } else if (parsed && Array.isArray(parsed.results)) {
        resultsList.push(parsed.results);
      }
    } catch (e) {
      console.warn('[Parser] Failed to parse search results JSON:', e);
    }
  }

  // Remove search results tags from cleanContent
  cleanContent = cleanContent.replace(resultsRegex, '');

  // Regex for research steps
  const stepRegex = /<research-step\s+type="([^"]+)"\s+status="([^"]+)"(?:\s+query="([^"]*)")?(?:\s+url="([^"]*)")?\s*\/?>/g;
  
  let stepMatch;
  let searchResultIndex = 0;

  while ((stepMatch = stepRegex.exec(content)) !== null) {
    const type = stepMatch[1] as 'search' | 'browse' | 'x' | 'plan' | 'synthesis' | 'scrape' | 'map';
    const status = stepMatch[2] as 'started' | 'completed';
    const query = stepMatch[3] ? stepMatch[3].replace(/&quot;/g, '"') : undefined;
    const url = stepMatch[4] ? stepMatch[4].replace(/&quot;/g, '"') : undefined;

    if (status === 'started') {
      steps.push({
        type,
        status: 'started',
        query,
        url,
      });
    } else if (status === 'completed') {
      // Find the last started step of the same type that isn't completed yet
      const matchingStep = [...steps]
        .reverse()
        .find((s) => 
          s.type === type && 
          s.status === 'started' && 
          (type === 'plan' || type === 'synthesis'
            ? true
            : (url ? s.url === url : query ? s.query === query : true))
        );

      if (matchingStep) {
        matchingStep.status = 'completed';
        if (query) matchingStep.query = query;
        if (url) matchingStep.url = url;
        if ((type === 'search' || type === 'x') && searchResultIndex < resultsList.length) {
          matchingStep.results = resultsList[searchResultIndex];
          searchResultIndex++;
        }
      } else {
        // Fallback: if no started step found, just push a completed one
        const step: ResearchStep = { type, status: 'completed', query, url };
        if ((type === 'search' || type === 'x') && searchResultIndex < resultsList.length) {
          step.results = resultsList[searchResultIndex];
          searchResultIndex++;
        }
        steps.push(step);
      }
    }
  }

  // Remove research step tags from cleanContent
  cleanContent = cleanContent.replace(stepRegex, '').trim();

  return {
    steps,
    cleanContent,
  };
}
