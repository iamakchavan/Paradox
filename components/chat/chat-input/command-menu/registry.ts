export type ComposerMode = 'search' | 'research';

export type ComposerCommandAction = {
  type: 'set-mode';
  mode: ComposerMode;
};

export interface ComposerCommandDefinition {
  id: string;
  label: string;
  description: string;
  keywords: readonly string[];
  action: ComposerCommandAction;
}

export interface ComposerCommandTrigger {
  start: number;
  end: number;
  query: string;
  key: string;
}

export const COMPOSER_COMMANDS = [
  {
    id: 'web-search',
    label: 'Web search',
    description: 'Search the web for current information',
    keywords: ['web', 'search', 'lookup', 'browse', 'internet'],
    action: { type: 'set-mode', mode: 'search' },
  },
  {
    id: 'deep-research',
    label: 'Deep research',
    description: 'Research multiple sources and build a detailed report',
    keywords: ['deep', 'research', 'report', 'investigate'],
    action: { type: 'set-mode', mode: 'research' },
  },
] as const satisfies readonly ComposerCommandDefinition[];

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase().replace(/[_-]+/g, ' ').trim();
}

function getMatchScore(command: ComposerCommandDefinition, query: string): number | null {
  if (!query) return 0;
  const terms = [command.label, ...command.keywords].map(normalizeSearchText);
  if (terms.some(term => term === query)) return 0;
  if (terms.some(term => term.startsWith(query))) return 1;
  if (terms.some(term => term.split(/\s+/).some(word => word.startsWith(query)))) return 2;
  if (terms.some(term => term.includes(query))) return 3;
  return null;
}

export function filterComposerCommands(
  query: string,
  commands: readonly ComposerCommandDefinition[] = COMPOSER_COMMANDS,
): ComposerCommandDefinition[] {
  const normalizedQuery = normalizeSearchText(query);
  const matches: Array<{
    command: ComposerCommandDefinition;
    registryIndex: number;
    score: number;
  }> = [];

  commands.forEach((command, registryIndex) => {
    const score = getMatchScore(command, normalizedQuery);
    if (score !== null) matches.push({ command, registryIndex, score });
  });

  return matches
    .sort((first, second) => first.score - second.score || first.registryIndex - second.registryIndex)
    .map(candidate => candidate.command);
}

export function findComposerCommandTrigger(
  value: string,
  caretPosition: number,
): ComposerCommandTrigger | null {
  const safeCaret = Math.max(0, Math.min(caretPosition, value.length));
  const beforeCaret = value.slice(0, safeCaret);
  const match = /(^|\s)@([a-zA-Z0-9_-]*)$/.exec(beforeCaret);
  if (!match) return null;

  const start = (match.index ?? 0) + match[1].length;
  const query = match[2];
  return {
    start,
    end: safeCaret,
    query,
    key: `${start}:${safeCaret}:${query.toLocaleLowerCase()}`,
  };
}
