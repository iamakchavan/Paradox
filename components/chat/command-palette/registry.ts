export type CommandActionId = 'new-chat' | 'library' | 'apps-tools' | 'settings';

export type CommandAction = {
  id: CommandActionId;
  title: string;
  keywords: readonly string[];
  destination:
    | { type: 'route'; href: string }
    | { type: 'settings' };
};

export const COMMAND_ACTIONS: readonly CommandAction[] = [
  {
    id: 'new-chat',
    title: 'Create New Chat',
    keywords: ['new', 'chat', 'create', 'start'],
    destination: { type: 'route', href: '/chat' },
  },
  {
    id: 'library',
    title: 'Library',
    keywords: ['library', 'files', 'images', 'documents', 'uploads'],
    destination: { type: 'route', href: '/library' },
  },
  {
    id: 'apps-tools',
    title: 'Apps & Tools',
    keywords: ['apps', 'tools', 'connectors', 'integrations', 'mcp'],
    destination: { type: 'route', href: '/apps' },
  },
  {
    id: 'settings',
    title: 'Settings',
    keywords: ['settings', 'preferences', 'appearance', 'api keys', 'providers', 'search scrape'],
    destination: { type: 'settings' },
  },
];

export const COMMAND_ACTIONS_BY_ID = new Map<CommandActionId, CommandAction>(
  COMMAND_ACTIONS.map((action) => [action.id, action]),
);
