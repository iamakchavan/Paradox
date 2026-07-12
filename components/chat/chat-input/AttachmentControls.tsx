"use client";

import type { Ref } from 'react';
import { FileText, Image, Plus, Puzzle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PROVIDER_LOGOS } from '@/components/chat/integrations/IntegrationsTab';
import { MobileAttachSheet } from '@/components/chat/MobileAttachSheet';
import { DeepResearchIcon, isMobileOrTablet, WebSearchIcon } from './icons';
import type { ConnectedApp } from './types';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 10, transformOrigin: 'bottom left' },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transformOrigin: 'bottom left',
    transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 8,
    transformOrigin: 'bottom left',
    transition: { type: 'spring', stiffness: 450, damping: 32 },
  },
};

interface Props {
  fileInputRef: Ref<HTMLInputElement>;
  isMobile: boolean;
  isLoading: boolean;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  showMobileSheet: boolean;
  setShowMobileSheet: (show: boolean) => void;
  showAppsSubmenu: boolean;
  setShowAppsSubmenu: (show: boolean) => void;
  activeApps: ConnectedApp[];
  selectedMcpIds: string[];
  searchEnabled: boolean;
  researchEnabled: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAttach: (type: 'image' | 'pdf' | 'all') => void;
  onToggleSearch?: (enabled: boolean) => void;
  onToggleResearch?: (enabled: boolean) => void;
  onToggleMcpId: (id: string) => void;
  onManageConnectors: () => void;
}

export function AttachmentControls(props: Props) {
  return (
    <div className="relative attach-dropdown-container flex items-center justify-center shrink-0 h-9 w-9">
      <input
        type="file"
        ref={props.fileInputRef}
        onChange={props.onFileUpload}
        className="hidden"
        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf"
        multiple
      />
      {props.isMobile ? (
        <motion.div whileTap={{ scale: 0.88 }} className="h-9 w-9 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center shrink-0 cursor-pointer"
            onClick={() => {
              props.setShowMobileSheet(true);
              props.setShowDropdown(false);
            }}
            onMouseDown={event => event.preventDefault()}
            disabled={props.isLoading}
          >
            <Plus
              className="w-5 h-5 text-foreground/60 transition-transform duration-200"
              style={{ transform: props.showMobileSheet ? 'rotate(45deg)' : 'none' }}
            />
          </Button>
        </motion.div>
      ) : (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileTap={{ scale: 0.88 }} className="h-9 w-9 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center shrink-0 cursor-pointer"
                  onClick={() => props.setShowDropdown(!props.showDropdown)}
                  onMouseDown={event => event.preventDefault()}
                  disabled={props.isLoading}
                >
                  <Plus
                    className="w-5 h-5 text-foreground/60 transition-transform duration-200"
                    style={{ transform: props.showDropdown ? 'rotate(45deg)' : 'none' }}
                  />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" sideOffset={5} className="z-[60]">
              <p>Attach files</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <AnimatePresence>
        {!props.isMobile && props.showDropdown && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-12 left-0 w-[200px] bg-popover border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] p-1.5 z-50 flex flex-col gap-0.5 select-none"
          >
            <div className="flex flex-col">
              <MenuButton onClick={() => props.onAttach('image')} icon={<Image className="w-4 h-4 text-foreground/60 group-hover:text-foreground/80 transition-colors duration-150 shrink-0" strokeWidth={1.5} />}>
                Upload image
              </MenuButton>
              <MenuButton onClick={() => props.onAttach('pdf')} icon={<FileText className="w-4 h-4 text-foreground/60 group-hover:text-foreground/80 transition-colors duration-150 shrink-0" strokeWidth={1.5} />}>
                Upload document
              </MenuButton>
            </div>
            <Divider />
            <button
              type="button"
              onClick={() => { props.onToggleSearch?.(!props.searchEnabled); props.setShowDropdown(false); }}
              onMouseDown={event => event.preventDefault()}
              className={cn(
                'group w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer whitespace-nowrap',
                props.searchEnabled
                  ? 'bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80 hover:text-foreground',
              )}
            >
              <div className="flex items-center gap-3">
                <WebSearchIcon className={cn('w-4 h-4 shrink-0 transition-colors duration-150', props.searchEnabled ? 'text-blue-500' : 'text-foreground/60 group-hover:text-foreground/80')} />
                <span className="transition-colors duration-150">Web search</span>
              </div>
              {props.searchEnabled && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mr-1" />}
            </button>
            <button
              type="button"
              onClick={() => { props.onToggleResearch?.(!props.researchEnabled); props.setShowDropdown(false); }}
              onMouseDown={event => event.preventDefault()}
              className={cn(
                'group w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer whitespace-nowrap',
                props.researchEnabled
                  ? 'bg-purple-500/10 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/15'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80 hover:text-foreground',
              )}
            >
              <div className="flex items-center gap-3">
                <DeepResearchIcon className={cn('w-4 h-4 shrink-0 transition-colors duration-150', props.researchEnabled ? 'text-purple-500' : 'text-foreground/60 group-hover:text-foreground/80')} />
                <span className="transition-colors duration-150">Deep research</span>
              </div>
              {props.researchEnabled && <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0 mr-1" />}
            </button>
            <Divider />
            <AppsMenu {...props} />
          </motion.div>
        )}
      </AnimatePresence>
      <MobileAttachSheet
        isOpen={props.showMobileSheet}
        onClose={() => props.setShowMobileSheet(false)}
        onAttachImage={() => props.onAttach('image')}
        onAttachDocument={() => props.onAttach('pdf')}
        searchEnabled={props.searchEnabled}
        onToggleSearch={props.onToggleSearch}
        researchEnabled={props.researchEnabled}
        onToggleResearch={props.onToggleResearch}
        activeApps={props.activeApps}
        selectedMcpIds={props.selectedMcpIds}
        onToggleMcpId={props.onToggleMcpId}
        onManageConnectors={() => {
          props.onManageConnectors();
          props.setShowMobileSheet(false);
        }}
      />
    </div>
  );
}

function AppsMenu(props: Props) {
  return (
    <div
      className="relative"
      onMouseEnter={() => { if (!isMobileOrTablet()) props.setShowAppsSubmenu(true); }}
      onMouseLeave={() => { if (!isMobileOrTablet()) props.setShowAppsSubmenu(false); }}
    >
      <button
        type="button"
        onClick={event => {
          if (props.activeApps.length > 0) {
            event.stopPropagation();
            props.setShowDropdown(true);
            props.setShowAppsSubmenu(!props.showAppsSubmenu);
          } else {
            props.onManageConnectors();
            props.setShowDropdown(false);
          }
        }}
        onMouseDown={event => event.preventDefault()}
        className={cn(
          'group w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer whitespace-nowrap',
          props.showAppsSubmenu
            ? 'bg-black/5 dark:bg-white/5 text-foreground'
            : 'text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
        )}
      >
        <div className="flex items-center gap-3">
          <Puzzle className="w-4 h-4 text-foreground/60 group-hover:text-foreground/80 transition-colors duration-150 shrink-0" strokeWidth={1.5} />
          <span className="transition-colors duration-150">Apps</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {props.activeApps.length > 0 && (
            <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {props.activeApps.length}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/50 font-normal">❯</span>
        </div>
      </button>
      <AnimatePresence>
        {props.showAppsSubmenu && (
          <motion.div
            initial={{ opacity: 0, x: 6, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-[calc(100%+8px)] bottom-0 w-[200px] bg-popover border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] p-1.5 z-50 flex flex-col gap-0.5"
          >
            {props.activeApps.length === 0 ? (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center leading-normal">
                No apps connected. Click settings to manage.
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 max-h-[260px] overflow-y-auto pr-0.5 sidebar-scroll">
                <div className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground/65">Connectors</div>
                {props.activeApps.map(app => {
                  const AppIcon = PROVIDER_LOGOS[app.id] || Puzzle;
                  const selected = props.selectedMcpIds.includes(app.id);
                  const custom = !PROVIDER_LOGOS[app.id];
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={event => { event.stopPropagation(); props.onToggleMcpId(app.id); }}
                      className={cn(
                        'group w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 text-left cursor-pointer whitespace-nowrap',
                        selected
                          ? 'bg-black/[0.03] dark:bg-white/[0.045] text-foreground'
                          : 'hover:bg-black/[0.035] dark:hover:bg-white/[0.045] text-foreground/75 hover:text-foreground',
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {custom
                          ? <AppIcon className="w-3.5 h-3.5 shrink-0 text-foreground/55 group-hover:text-foreground/75 transition-colors duration-150" strokeWidth={1.5} />
                          : <AppIcon className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{app.name}</span>
                      </div>
                      <span aria-hidden="true" className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-out', selected ? 'bg-foreground' : 'bg-zinc-300 dark:bg-zinc-700')}>
                        <span className={cn('absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow-sm transition-transform duration-200 ease-out', selected && 'translate-x-4')} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <Divider />
            <button
              type="button"
              onClick={() => {
                props.onManageConnectors();
                props.setShowDropdown(false);
                props.setShowAppsSubmenu(false);
              }}
              className="group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/5 transition-all duration-150 text-left cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Manage connectors</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuButton({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={event => event.preventDefault()}
      className="group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80 hover:text-foreground transition-all duration-150 text-left cursor-pointer whitespace-nowrap"
    >
      {icon}
      <span className="transition-colors duration-150">{children}</span>
    </button>
  );
}

function Divider() {
  return <div className="my-1 border-t border-border/40" />;
}
