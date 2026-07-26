import { useState, useEffect } from 'react';

export interface ApiKeys {
  geminiApiKey: string | null;
  perplexityApiKey: string | null;
  mistralApiKey: string | null;
  inceptionApiKey: string | null;
  zenmuxApiKey: string | null;
  nvidiaApiKey: string | null;
  tavilyApiKey: string | null;
  exaApiKey: string | null;
  firecrawlApiKey: string | null;
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeys>({
    geminiApiKey: null,
    perplexityApiKey: null,
    mistralApiKey: null,
    inceptionApiKey: null,
    zenmuxApiKey: null,
    nvidiaApiKey: null,
    tavilyApiKey: null,
    exaApiKey: null,
    firecrawlApiKey: null,
  });

  useEffect(() => {
    setKeys({
      geminiApiKey: localStorage.getItem('gemini-api-key'),
      perplexityApiKey: localStorage.getItem('perplexity-api-key'),
      mistralApiKey: localStorage.getItem('mistral-api-key'),
      inceptionApiKey: localStorage.getItem('inception-api-key'),
      zenmuxApiKey: localStorage.getItem('zenmux-api-key'),
      nvidiaApiKey: localStorage.getItem('nvidia-api-key'),
      tavilyApiKey: localStorage.getItem('tavily-api-key'),
      exaApiKey: localStorage.getItem('exa-api-key'),
      firecrawlApiKey: localStorage.getItem('firecrawl-api-key'),
    });
  }, []);

  const updateKey = (keyName: keyof ApiKeys, value: string | null) => {
    setKeys(prev => ({ ...prev, [keyName]: value }));
  };

  return { keys, updateKey };
}
