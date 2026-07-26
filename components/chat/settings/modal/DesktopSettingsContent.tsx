"use client";

import { AnimatePresence, motion } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FloatingIconButton } from '@/components/ui/floating-icon-button';
import { SETTINGS_TABS } from './settings-modal-config';
import { SettingsTabContent } from './SettingsTabContent';
import type { SettingsModalController } from './use-settings-modal-controller';

export function DesktopSettingsContent({ controller }: { controller: SettingsModalController }) {
  return (
    <>
        <DialogPrimitive.Title className="sr-only">Settings</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">
          Configure your API credentials and appearance preferences
        </DialogPrimitive.Description>

        <aside className="flex w-[220px] flex-shrink-0 select-none flex-col border-r border-zinc-200/60 bg-transparent px-3 py-5 dark:border-white/[0.08]">
          <div className="px-3 pb-5 pt-1">
            <h1 className="text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Settings</h1>
            <p className="mt-1 text-[11px] leading-4 text-zinc-400 dark:text-zinc-600">Manage your preferences</p>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Settings sections">
          {SETTINGS_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = controller.activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => controller.setActiveTab(tab.id)}
                className={cn(
                  'flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[13px] font-medium transition-[background-color,color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] cursor-pointer',
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 dark:bg-white/[0.08] dark:text-zinc-50'
                    : 'text-zinc-500 hover:bg-zinc-100/60 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-600')} strokeWidth={2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          </nav>
        </aside>

        <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-[78px] items-center justify-between px-7">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-white/95 to-transparent backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.9)_35%,rgba(0,0,0,0.35)_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.9)_35%,rgba(0,0,0,0.35)_72%,transparent_100%)] dark:from-[hsl(var(--surface-panel))] dark:via-[hsl(var(--surface-panel)/0.95)]" />
            <div className="relative z-10 min-w-0">
              <h2 className="text-[16px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {SETTINGS_TABS.find(tab => tab.id === controller.activeTab)?.label}
              </h2>
              <p className="mt-1 text-[11px] leading-4 text-zinc-400 dark:text-zinc-600">
                {SETTINGS_TABS.find(tab => tab.id === controller.activeTab)?.description}
              </p>
            </div>
            <DialogPrimitive.Close asChild>
              <FloatingIconButton className="pointer-events-auto relative z-10 h-8 w-8" aria-label="Close settings">
                <X className="h-3.5 w-3.5" />
              </FloatingIconButton>
            </DialogPrimitive.Close>
          </div>

          <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-7 pb-24 pt-[94px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={controller.activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <SettingsTabContent
                  activeTab={controller.activeTab}
                  apiKeys={controller.apiKeys}
                  inputKeys={controller.inputKeys}
                  setInputKeys={controller.setInputKeys}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-24 items-end justify-end gap-2 px-7 pb-5">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-xl [mask-image:linear-gradient(to_top,black_0%,rgba(0,0,0,0.9)_35%,rgba(0,0,0,0.35)_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,rgba(0,0,0,0.9)_35%,rgba(0,0,0,0.35)_72%,transparent_100%)] dark:from-[hsl(var(--surface-panel))] dark:via-[hsl(var(--surface-panel)/0.95)]" />
            <DialogPrimitive.Close asChild>
              <button className="pointer-events-auto relative z-10 h-9 rounded-full px-4 text-[12px] font-medium text-zinc-500 transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer active:scale-[0.97] motion-reduce:transform-none dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100">
                Cancel
              </button>
            </DialogPrimitive.Close>
            <button
              onClick={controller.save}
              className="pointer-events-auto relative z-10 h-9 rounded-full bg-zinc-950 px-5 text-[12px] font-semibold text-white shadow-sm transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] hover:bg-zinc-800 cursor-pointer active:scale-[0.97] motion-reduce:transform-none dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Save Changes
            </button>
          </div>
        </div>
    </>
  );
}
