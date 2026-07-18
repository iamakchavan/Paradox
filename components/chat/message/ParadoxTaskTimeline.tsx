"use client";

import { memo, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Globe, Network, Search, Terminal } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProviderPresentation } from '@/components/chat/integrations/provider-catalog';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { getIntegrationFromToolName } from '@/utils/mcp-helpers';
import { DotmSquare11 } from '@/components/ui/dotm-square-11';

interface Props {
  steps: string[];
  isStreaming: boolean;
}

export const ParadoxTaskTimeline = memo(({ steps, isStreaming }: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  useEffect(() => {
    if (isStreaming) setIsCollapsed(false);
  }, [isStreaming]);
  const integrations = useLiveQuery(() => db.mcpIntegrations.toArray()) || [];
  const toolToIntegrationMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const integration of integrations) {
      if (!Array.isArray(integration.cachedTools)) continue;
      for (const tool of integration.cachedTools) {
        const cleanName = tool.name.replace(/:/g, '_');
        map.set(cleanName.toLowerCase().replace(/[^a-z0-9]/g, ''), integration);
        const prefix = `${integration.id.toLowerCase()}_`;
        if (cleanName.startsWith(prefix)) {
          map.set(cleanName.substring(prefix.length).toLowerCase().replace(/[^a-z0-9]/g, ''), integration);
        }
      }
    }
    return map;
  }, [integrations]);
  const groupedSteps = useMemo(() => {
    interface GroupedStep {
      type: 'integration' | 'web' | 'read' | 'map' | 'other';
      key: string;
      integrationId?: string;
      logo?: any;
      label: string;
      subActions: string[];
      isItemLoading: boolean;
    }
    const grouped: GroupedStep[] = [];
    const lastStepIndex = steps.length - 1;
    steps.forEach((step, index) => {
      const isItemLoading = isStreaming && index === lastStepIndex;
      const integration = getIntegrationFromToolName(step, toolToIntegrationMap);
      if (integration) {
        const previous = grouped[grouped.length - 1];
        if (previous?.type === 'integration' && previous.integrationId === integration.id) {
          if (!previous.subActions.includes(integration.action)) previous.subActions.push(integration.action);
          if (isItemLoading) previous.isItemLoading = true;
        } else {
          grouped.push({
            type: 'integration',
            key: `integration-${integration.id}-${grouped.length}`,
            integrationId: integration.id,
            logo: integration.logo,
            label: `Using ${getProviderPresentation(integration).name}`,
            subActions: [integration.action],
            isItemLoading,
          });
        }
        return;
      }
      let label = step;
      let type: GroupedStep['type'] = 'other';
      if (step.startsWith('Reading ')) {
        label = `Reading page: ${step.replace('Reading ', '')}`;
        type = 'read';
      } else if (step.startsWith('Mapping ')) {
        label = `Mapping site: ${step.replace('Mapping ', '')}`;
        type = 'map';
      } else if (step === 'Searching web...') {
        label = 'Searching the web';
        type = 'web';
      }
      grouped.push({
        type,
        key: `${type}-${index}-${step}`,
        label,
        subActions: [],
        isItemLoading,
      });
    });
    return grouped;
  }, [isStreaming, steps, toolToIntegrationMap]);

  if (!steps?.length) return null;
  return (
    <div className="w-full mb-6 mt-1.5 select-none">
      <button
        type="button"
        onClick={() => setIsCollapsed(previous => !previous)}
        className="flex items-center gap-2 text-left cursor-pointer focus:outline-hidden group"
      >
        {isStreaming ? (
          <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
            <DotmSquare11
              size={17}
              dotSize={2}
              cellPadding={1}
              speed={1.35}
              opacityBase={0.12}
              opacityMid={0.42}
              opacityPeak={1}
              className="text-zinc-500/85 dark:text-zinc-400/85"
            />
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center shrink-0">
            <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
          </div>
        )}
        <span className={cn(
          'text-xs font-medium tracking-tight flex items-center gap-1.5',
          isStreaming
            ? 'thinking-shine font-semibold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-colors duration-200',
        )}>
          {isStreaming ? 'Running Paradox task...' : 'Paradox task complete'}
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
            ({steps.length} {steps.length === 1 ? 'action' : 'actions'})
          </span>
        </span>
        <ChevronDown className={cn(
          'w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-250',
          !isCollapsed && 'rotate-180',
        )} />
      </button>
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 pl-3 space-y-3.5 border-l border-zinc-200 dark:border-zinc-800 ml-[7px] mt-1.5 pb-1">
              {groupedSteps.map(group => {
                let icon: React.ReactNode;
                if (group.type === 'integration') {
                  const AppIcon = group.logo;
                  icon = (
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center text-foreground">
                      <AppIcon className="w-3.5 h-3.5" />
                    </div>
                  );
                } else {
                  const LucideIcon = group.type === 'read'
                    ? Globe
                    : group.type === 'map'
                      ? Network
                      : group.type === 'web' ? Search : Terminal;
                  icon = <LucideIcon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />;
                }
                return (
                  <div key={group.key} className="flex items-start gap-2.5 relative group">
                    <div className="pt-0.5 select-none">{icon}</div>
                    <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                      <span className={cn(
                        'text-[11px] font-medium leading-tight truncate',
                        group.isItemLoading
                          ? 'thinking-shine font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 transition-colors duration-200',
                      )}>
                        {group.label}
                      </span>
                      {group.subActions.length > 0 && (
                        <div className="flex flex-col gap-0.5 mt-0.5 pl-0.5">
                          {group.subActions.map((action, index) => (
                            <span key={index} className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-mono font-medium leading-none">
                              {action}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
ParadoxTaskTimeline.displayName = 'ParadoxTaskTimeline';
