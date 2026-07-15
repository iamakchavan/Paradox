"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AttachmentControls } from './chat-input/AttachmentControls';
import { AttachmentPreviews } from './chat-input/AttachmentPreviews';
import { ComposerCommandMenu } from './chat-input/command-menu/ComposerCommandMenu';
import { ComposerSubmitButton } from './chat-input/ComposerSubmitButton';
import { ComposerTextarea } from './chat-input/ComposerTextarea';
import { DropOverlay } from './chat-input/DropOverlay';
import { ModeCapsules } from './chat-input/ModeCapsules';
import type { ChatInputProps } from './chat-input/types';
import { useChatInputController } from './chat-input/use-chat-input-controller';

export const ChatInput = ({
  isInitialView = false,
  shouldFocus = false,
  searchEnabled = false,
  researchEnabled = false,
  selectedMcpIds = [],
  onToggleMcpId = () => {},
  ...rest
}: ChatInputProps) => {
  const props: ChatInputProps = {
    ...rest,
    isInitialView,
    shouldFocus,
    searchEnabled,
    researchEnabled,
    selectedMcpIds,
    onToggleMcpId,
  };
  const controller = useChatInputController(props);

  return (
    <div className="w-full">
      {props.error && (
        <div className={cn(
          'mb-3 p-3 bg-destructive/10 border border-destructive rounded-xl text-destructive text-xs sm:text-sm',
          !isInitialView && 'backdrop-blur-sm',
        )}>
          {props.error}
        </div>
      )}
      <div className="relative isolate w-full">
        <ComposerCommandMenu
          isOpen={controller.commandMenu.isOpen}
          listboxId={controller.commandMenu.listboxId}
          commands={controller.commandMenu.commands}
          activeCommandId={controller.commandMenu.activeCommandId}
          activeMode={searchEnabled ? 'search' : researchEnabled ? 'research' : null}
          onActiveCommandChange={controller.commandMenu.setActiveCommandId}
          onSelectCommand={controller.commandMenu.selectCommand}
        />
        <div className={cn(
          'relative z-10 w-full flex flex-col bg-background/95 backdrop-blur-md border rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] group transition-[border-color,background-color,box-shadow] duration-300',
          controller.isDragging
            ? 'border-2 border-dashed border-blue-500/50 dark:border-blue-400/50 bg-blue-500/[0.03] dark:bg-blue-500/[0.05] overflow-hidden py-5'
            : 'border-border/80 overflow-visible hover:border-zinc-300 dark:hover:border-zinc-700 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:ring-4 focus-within:ring-zinc-500/[0.04] dark:focus-within:ring-zinc-400/[0.04] focus-within:shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:focus-within:shadow-[0_12px_40px_rgba(0,0,0,0.25)]',
        )}>
          {controller.isDragging ? (
            <DropOverlay />
          ) : (
            <>
              <AttachmentPreviews
                images={props.selectedImages}
                pdfs={props.selectedPDFs}
                removeImage={props.removeImage}
                removePDF={props.removePDF}
              />
              <motion.div className={cn(
                'w-full relative flex transition-[padding,min-height] duration-[var(--motion-duration-content)] ease-[var(--motion-ease-out)] motion-reduce:transition-none',
                controller.expanded
                  ? 'flex-col pt-2.5 pb-[46px] px-4'
                  : 'flex-row items-center gap-1 pl-1.5 pr-1.5 py-1.5 min-h-[48px]',
              )}>
                <div className={cn(
                  'flex items-center gap-2 shrink-0',
                  controller.expanded ? 'absolute bottom-2 left-2.5 h-9' : '',
                )}>
                  <AttachmentControls
                    fileInputRef={controller.fileInputRef}
                    isMobile={controller.isMobile}
                    isLoading={props.isLoading}
                    showDropdown={controller.showAttachDropdown}
                    setShowDropdown={controller.setShowAttachDropdown}
                    showMobileSheet={controller.showMobileAttachSheet}
                    setShowMobileSheet={controller.setShowMobileAttachSheet}
                    showAppsSubmenu={controller.showAppsSubmenu}
                    setShowAppsSubmenu={controller.setShowAppsSubmenu}
                    activeApps={controller.activeApps}
                    selectedMcpIds={selectedMcpIds}
                    searchEnabled={searchEnabled}
                    researchEnabled={researchEnabled}
                    onFileUpload={props.handleFileUpload}
                    onAttach={controller.attach}
                    onToggleSearch={props.onToggleSearch}
                    onToggleResearch={props.onToggleResearch}
                    onToggleMcpId={onToggleMcpId}
                    onManageConnectors={() => props.onOpenSettingsTab?.('integrations')}
                  />
                  <ModeCapsules
                    searchEnabled={searchEnabled}
                    researchEnabled={researchEnabled}
                    searchHovered={controller.isSearchCapsuleHovered}
                    researchHovered={controller.isResearchCapsuleHovered}
                    setSearchHovered={controller.setIsSearchCapsuleHovered}
                    setResearchHovered={controller.setIsResearchCapsuleHovered}
                    toggleSearch={props.onToggleSearch}
                    toggleResearch={props.onToggleResearch}
                  />
                </div>
                <ComposerTextarea
                  textareaRef={controller.textareaRef}
                  value={controller.localMessage}
                  expanded={controller.expanded}
                  isMobile={controller.isMobile}
                  isLoading={props.isLoading}
                  isSendDisabled={controller.isSendDisabled}
                  isInputDisabled={controller.isInputDisabled}
                  searchEnabled={searchEnabled}
                  researchEnabled={researchEnabled}
                  commandMenuOpen={controller.commandMenu.isOpen}
                  commandMenuListboxId={controller.commandMenu.listboxId}
                  commandMenuActiveOptionId={controller.commandMenu.activeOptionId}
                  onChange={controller.handleTextChange}
                  onSelectionChange={controller.handleSelectionChange}
                  onCommandKeyDown={controller.commandMenu.handleKeyDown}
                  onFocus={controller.handleFocus}
                  onBlur={controller.handleBlur}
                  onPaste={controller.handlePaste}
                  onSubmit={controller.submit}
                />
                <ComposerSubmitButton
                  expanded={controller.expanded}
                  isLoading={props.isLoading}
                  isSendDisabled={controller.isSendDisabled}
                  onStop={props.onStop}
                  onSubmit={controller.submit}
                />
              </motion.div>
            </>
          )}
        </div>
      </div>
      {isInitialView && controller.isInputDisabled && (
        <p className="text-center text-muted-foreground mt-4 text-xs sm:text-sm">
          Please set your API keys in the settings to start chatting
        </p>
      )}
    </div>
  );
};
