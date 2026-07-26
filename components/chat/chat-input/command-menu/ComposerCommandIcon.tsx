'use client';

import { Puzzle } from 'lucide-react';
import { PROVIDER_LOGOS } from '@/components/chat/integrations/provider-catalog';
import { cn } from '@/lib/utils';
import { DeepResearchIcon, WebSearchIcon } from '../icons';
import type { ComposerCommandDefinition } from './registry';

interface ComposerCommandIconProps {
  command: ComposerCommandDefinition;
  className?: string;
}

export function ComposerCommandIcon({
  command,
  className,
}: ComposerCommandIconProps) {
  if (command.action.type === 'set-mode') {
    const Icon = command.action.mode === 'search' ? WebSearchIcon : DeepResearchIcon;
    return (
      <Icon
        className={cn(
          className,
          command.action.mode === 'search'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-purple-600 dark:text-purple-400',
        )}
      />
    );
  }

  if (command.action.type === 'toggle-app') {
    const AppIcon = PROVIDER_LOGOS[command.action.appId];
    if (AppIcon) return <AppIcon className={className} />;
  }

  return (
    <Puzzle
      className={cn(className, 'text-foreground/58')}
      strokeWidth={1.7}
    />
  );
}
