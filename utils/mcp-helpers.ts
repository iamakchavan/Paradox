import { Puzzle } from 'lucide-react';
import { PROVIDER_LOGOS } from '@/components/chat/integrations/IntegrationsTab';

export const KEYWORD_MAP: Record<string, string[]> = {
  yahoofinance: ['quote', 'ticker', 'stock', 'finance', 'chart', 'historical', 'history'],
  neon: ['neon', 'database', 'db_'],
  netlify: ['netlify', 'deploy', 'site'],
  cloudflare: ['cloudflare', 'dns', 'zone'],
  github: ['github', 'repo', 'issue', 'pull'],
  notion: ['notion', 'page', 'block'],
  cal: ['cal', 'booking', 'event'],
  vercel: ['vercel'],
  linear: ['linear'],
  jira: ['jira'],
  asana: ['asana'],
  airtable: ['airtable'],
  parallel: ['parallel', 'search']
};

export const getIntegrationFromToolName = (
  stepText: string,
  toolToIntegrationMap: Map<string, any>
) => {
  let toolName = stepText;
  if (stepText.startsWith('Executing ')) {
    toolName = stepText.replace('Executing ', '').replace(/\.\.\.$/, '').trim();
  } else if (stepText.startsWith('Executing app tool: ')) {
    toolName = stepText.replace('Executing app tool: ', '').replace(/\.\.\.$/, '').trim();
  } else {
    return null;
  }

  const normalized = toolName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Dynamic database tool-to-integration lookup
  const dbMatch = toolToIntegrationMap.get(normalized);
  if (dbMatch) {
    const key = dbMatch.id;
    let name = dbMatch.name;
    if (key === 'yahoofinance') name = 'Yahoo Finance';
    else if (key === 'cryptocom') name = 'Crypto.com';
    else if (key === 'swiggy_food') name = 'Swiggy Food';
    else if (key === 'swiggy_dineout') name = 'Swiggy Dineout';
    else if (key === 'swiggy_instamart') name = 'Swiggy Instamart';
    else if (key === 'parallel') name = 'Parallel Search';

    let action = toolName;
    const prefix = `${key.toLowerCase()}_`;
    if (toolName.toLowerCase().startsWith(prefix)) {
      action = toolName.substring(prefix.length);
    }

    return {
      id: key,
      name,
      logo: PROVIDER_LOGOS[key] || Puzzle,
      action
    };
  }

  // 2. Prefix match fallback (if map is empty or not yet loaded)
  for (const key of Object.keys(PROVIDER_LOGOS)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.startsWith(normalizedKey)) {
      let name = key.charAt(0).toUpperCase() + key.slice(1);
      if (key === 'yahoofinance') name = 'Yahoo Finance';
      else if (key === 'cryptocom') name = 'Crypto.com';
      else if (key === 'swiggy_food') name = 'Swiggy Food';
      else if (key === 'swiggy_dineout') name = 'Swiggy Dineout';
      else if (key === 'swiggy_instamart') name = 'Swiggy Instamart';
      else if (key === 'parallel') name = 'Parallel Search';
      
      let action = toolName;
      const keySegments = key.split('_');
      const toolSegments = toolName.split('_');
      const actionSegments = toolSegments.filter(seg => !keySegments.includes(seg.toLowerCase()) && !normalizedKey.includes(seg.toLowerCase()));
      if (actionSegments.length > 0) {
        action = actionSegments.join('_');
      }

      return {
        id: key,
        name,
        logo: PROVIDER_LOGOS[key],
        action
      };
    }
  }

  // 3. Keyword fallback mapping (for un-prefixed server-side proxy tools)
  for (const [key, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(kw => toolName.toLowerCase().includes(kw))) {
      let name = key.charAt(0).toUpperCase() + key.slice(1);
      if (key === 'yahoofinance') name = 'Yahoo Finance';
      else if (key === 'cryptocom') name = 'Crypto.com';
      else if (key === 'swiggy_food') name = 'Swiggy Food';
      else if (key === 'swiggy_dineout') name = 'Swiggy Dineout';
      else if (key === 'swiggy_instamart') name = 'Swiggy Instamart';
      else if (key === 'parallel') name = 'Parallel Search';

      return {
        id: key,
        name,
        logo: PROVIDER_LOGOS[key] || Puzzle,
        action: toolName
      };
    }
  }

  return {
    id: 'unknown',
    name: 'App Tool',
    logo: Puzzle,
    action: toolName
  };
};
