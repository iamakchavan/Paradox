"use client";

import { AnimatePresence, motion } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FloatingIconButton } from '@/components/ui/floating-icon-button';
import { SETTINGS_TABS } from './settings-modal-config';
import { SettingsTabContent } from './SettingsTabContent';
import type { SettingsModalController } from './use-settings-modal-controller';

export function MobileSettingsContent({ controller }: { controller: SettingsModalController }) {
  return (
    <>
        <DialogPrimitive.Title className="sr-only">Settings</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">
          Configure your API credentials and appearance preferences
        </DialogPrimitive.Description>

        <div className="flex justify-center pt-2.5 pb-2 flex-shrink-0 cursor-grab">
          <div className="w-11 h-[4px] rounded-full bg-foreground/35" />
        </div>

        <div className={cn(
          'flex items-center justify-between px-6 flex-shrink-0',
          controller.mobileView ? 'pt-1 pb-4' : 'h-0 overflow-hidden'
        )}>
          {controller.mobileView ? (
            <button
              onClick={controller.closeMobileView}
              className="flex items-center gap-1.5 text-[15px] font-medium text-foreground/60 hover:text-foreground transition-colors cursor-pointer active:scale-[0.96] select-none"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Settings</span>
            </button>
          ) : null}
          <DialogPrimitive.Close asChild>
            <FloatingIconButton className={cn(!controller.mobileView && 'hidden')}>
              <X className="w-3.5 h-3.5" />
            </FloatingIconButton>
          </DialogPrimitive.Close>
        </div>

        <div className="flex-1 overflow-hidden min-h-0 relative">
          <AnimatePresence mode="wait" initial={false}>
            {!controller.mobileView ? (
              <motion.div
                key="mobile-tab-list"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 flex flex-col overflow-hidden"
              >
                <div className="px-6 pt-5">
                  {SETTINGS_TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => controller.setMobileView(tab.id)}
                        className="w-full h-[50px] flex items-center justify-between text-left cursor-pointer select-none rounded-xl active:bg-foreground/[0.04] transition-colors duration-100"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <Icon className="w-[17px] h-[17px] text-foreground/45 flex-shrink-0" strokeWidth={1.9} />
                          <span className="text-[17px] font-medium text-foreground/55 truncate">{tab.label}</span>
                        </div>
                        <ChevronRight className="w-[18px] h-[18px] text-foreground/45 flex-shrink-0" strokeWidth={1.9} />
                      </button>
                    );
                  })}
                </div>
                <div className="flex-1" />
              </motion.div>
            ) : (
              <motion.div
                key={`mobile-content-${controller.mobileView}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 overflow-y-auto sidebar-scroll"
              >
                <div className="px-4 pt-2 pb-4 space-y-4">
                  <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                    {SETTINGS_TABS.find(tab => tab.id === controller.mobileView)?.label}
                  </h3>
                  <SettingsTabContent
                    activeTab={controller.mobileView}
                    apiKeys={controller.apiKeys}
                    inputKeys={controller.inputKeys}
                    setInputKeys={controller.setInputKeys}
                  />
                </div>
                <div
                  className="sticky bottom-0 px-4 py-4 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, light-dark(#ffffff, #1c1c1e) 60%, transparent)' }}
                >
                  <button
                    onClick={controller.save}
                    className="pointer-events-auto w-full h-12 rounded-2xl text-[14px] font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all cursor-pointer active:scale-[0.98] shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </>
  );
}
