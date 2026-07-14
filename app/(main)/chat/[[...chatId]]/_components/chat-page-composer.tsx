"use client";

import { ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ApiKeys } from '@/hooks/use-api-keys';
import { ChatInput } from '@/components/chat/ChatInput';
import { cn } from '@/lib/utils';
import { motionTransitions } from '@/lib/motion';
import type { ChatPdfAttachment, OpenSettingsTab } from '../_lib/types';

export interface ChatComposerControls {
  handleSubmit: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
  apiKeys: ApiKeys;
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImages: string[];
  removeImage: (index: number) => void;
  selectedPDFs: ChatPdfAttachment[];
  removePDF: (index: number) => void;
  error: string | null;
  searchEnabled: boolean;
  onToggleSearch: (enabled: boolean) => void;
  researchEnabled: boolean;
  onToggleResearch: (enabled: boolean) => void;
  onExpandedChange: (expanded: boolean) => void;
  onOpenSettingsTab: (tab: OpenSettingsTab) => void;
  selectedMcpIds: string[];
  onToggleMcpId: (id: string) => void;
}

function ComposerInput({ controls, initial }: { controls: ChatComposerControls; initial: boolean }) {
  return (
    <ChatInput
      handleSubmit={controls.handleSubmit}
      onStop={controls.onStop}
      isLoading={controls.isLoading}
      geminiApiKey={controls.apiKeys.geminiApiKey}
      mistralApiKey={controls.apiKeys.mistralApiKey}
      perplexityApiKey={controls.apiKeys.perplexityApiKey}
      zenmuxApiKey={controls.apiKeys.zenmuxApiKey}
      nvidiaApiKey={controls.apiKeys.nvidiaApiKey}
      inceptionApiKey={controls.apiKeys.inceptionApiKey}
      selectedModelId={controls.selectedModelId}
      onSelectModel={controls.onSelectModel}
      handleFileUpload={controls.handleFileUpload}
      selectedImages={controls.selectedImages}
      removeImage={controls.removeImage}
      selectedPDFs={controls.selectedPDFs}
      removePDF={controls.removePDF}
      error={controls.error}
      isInitialView={initial}
      shouldFocus={initial}
      searchEnabled={controls.searchEnabled}
      onToggleSearch={controls.onToggleSearch}
      researchEnabled={controls.researchEnabled}
      onToggleResearch={controls.onToggleResearch}
      onExpandedChange={controls.onExpandedChange}
      onOpenSettingsTab={controls.onOpenSettingsTab}
      selectedMcpIds={controls.selectedMcpIds}
      onToggleMcpId={controls.onToggleMcpId}
    />
  );
}

export function InitialChatComposer({ controls, expanded, keyboardOffset }: {
  controls: ChatComposerControls;
  expanded: boolean;
  keyboardOffset: number;
}) {
  return (
    <motion.div
      layoutId="chat-input-bar"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransitions.popover}
      className={cn(
          'w-full mx-auto fixed bottom-6 left-0 right-0 z-20 motion-reduce:!transition-none md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:px-0',
        expanded
          ? 'max-w-[720px] px-3 sm:px-2 md:px-0'
          : 'max-w-2xl focus-within:max-w-[720px] px-10 focus-within:px-3 sm:px-4 md:focus-within:px-0',
      )}
      style={{
        transition: 'bottom 300ms cubic-bezier(0.4, 0, 0.2, 1), max-width 300ms cubic-bezier(0.4, 0, 0.2, 1), padding 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        bottom: keyboardOffset > 0 ? `${keyboardOffset + 8}px` : undefined,
      }}
    >
      <ComposerInput controls={controls} initial />
    </motion.div>
  );
}

export function ActiveChatComposer({
  controls, expanded, keyboardOffset, sidebarCollapsed, mounted, showScrollButton, scrollToBottom,
}: {
  controls: ChatComposerControls;
  expanded: boolean;
  keyboardOffset: number;
  sidebarCollapsed: boolean;
  mounted: boolean;
  showScrollButton: boolean;
  scrollToBottom: () => void;
}) {
  return (
    <>
      <div
        className={cn(
          'fixed bottom-0 right-0 md:right-[var(--sources-panel-width,0px)] z-10 h-32 sm:h-40 pointer-events-none progressive-blur',
          mounted && 'transition-[left,right,bottom] motion-layout-transition motion-reduce:transition-none',
          sidebarCollapsed ? 'left-0' : 'left-0 md:left-[270px]',
        )}
        style={keyboardOffset > 0 ? { bottom: `${keyboardOffset}px` } : undefined}
      />
      <motion.div
        layoutId="chat-input-bar"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTransitions.popover}
        className={cn(
          'fixed z-20 bottom-6 sm:bottom-12 right-0 md:right-[var(--sources-panel-width,0px)] mx-auto motion-reduce:!transition-none',
          sidebarCollapsed ? 'left-0' : 'left-0 md:left-[270px]',
          expanded
            ? 'max-w-[720px] px-3 sm:px-2 md:px-4'
            : 'max-w-2xl px-10 sm:px-4 focus-within:max-w-[720px] focus-within:px-3 sm:focus-within:px-2 md:focus-within:px-4',
        )}
        style={{
          transition: mounted
            ? 'left 300ms cubic-bezier(0.4, 0, 0.2, 1), right 300ms cubic-bezier(0.4, 0, 0.2, 1), bottom 300ms cubic-bezier(0.4, 0, 0.2, 1), max-width 300ms cubic-bezier(0.4, 0, 0.2, 1), padding 300ms cubic-bezier(0.4, 0, 0.2, 1)'
            : 'max-width 300ms cubic-bezier(0.4, 0, 0.2, 1), padding 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          bottom: keyboardOffset > 0 ? `${keyboardOffset + 8}px` : undefined,
        }}
      >
        <div className="absolute left-1/2 -translate-x-1/2 -top-11 z-20">
          <button
            onClick={event => { scrollToBottom(); event.currentTarget.blur(); }}
            onMouseDown={event => event.preventDefault()}
            aria-label="Scroll to bottom"
            className={cn(
              'h-9 w-9 rounded-full liquid-glass-dock flex items-center justify-center',
              'text-foreground/70 hover:text-foreground transform transition-[transform,opacity,color] duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] motion-reduce:transition-[opacity,color]',
              'active:scale-[0.93] active:duration-75 motion-reduce:transform-none',
              showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none',
            )}
          >
            <ArrowUp className="h-4 w-4 rotate-180" />
          </button>
        </div>
        <ComposerInput controls={controls} initial={false} />
      </motion.div>
    </>
  );
}
