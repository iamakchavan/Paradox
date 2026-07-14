"use client";

import { AnimatePresence, motion } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
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

        <div className="w-[200px] flex-shrink-0 border-r border-zinc-200/55 dark:border-zinc-800/70 bg-transparent flex flex-col py-5 px-3 gap-1 select-none">
          {SETTINGS_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = controller.activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => controller.setActiveTab(tab.id)}
                className={cn(
                  'w-full h-[36px] px-3 rounded-xl flex items-center gap-2.5 text-[13px] font-medium transition-[background-color,color] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] cursor-pointer text-left',
                  isActive
                    ? 'bg-foreground/[0.075] text-foreground'
                    : 'text-foreground/55 hover:text-foreground hover:bg-foreground/[0.04]'
                )}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-16 items-center justify-between px-6">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-white/95 to-transparent backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.9)_35%,rgba(0,0,0,0.35)_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.9)_35%,rgba(0,0,0,0.35)_72%,transparent_100%)] dark:from-zinc-950 dark:via-zinc-950/95" />
            <h2 className="relative z-10 text-[15px] font-semibold text-foreground tracking-tight">
              {SETTINGS_TABS.find(tab => tab.id === controller.activeTab)?.label}
            </h2>
            <DialogPrimitive.Close asChild>
              <button className="pointer-events-auto relative z-10 w-7 h-7 flex items-center justify-center rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/[0.05] transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] cursor-pointer active:scale-[0.93] motion-reduce:transform-none">
                <X className="w-4 h-4" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pt-20 pb-24 sidebar-scroll min-h-0">
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

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 flex items-end justify-end gap-2 px-6 pb-4">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-xl [mask-image:linear-gradient(to_top,black_0%,rgba(0,0,0,0.9)_35%,rgba(0,0,0,0.35)_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_top,black_0%,rgba(0,0,0,0.9)_35%,rgba(0,0,0,0.35)_72%,transparent_100%)] dark:from-zinc-950 dark:via-zinc-950/95" />
            <DialogPrimitive.Close asChild>
              <button className="pointer-events-auto relative z-10 h-8 px-4 rounded-lg text-[12px] font-medium text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] cursor-pointer active:scale-[0.97] motion-reduce:transform-none">
                Cancel
              </button>
            </DialogPrimitive.Close>
            <button
              onClick={controller.save}
              className="pointer-events-auto relative z-10 h-8 px-5 rounded-lg text-[12px] font-semibold bg-foreground text-background hover:bg-foreground/90 transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] cursor-pointer active:scale-[0.97] motion-reduce:transform-none shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
    </>
  );
}
