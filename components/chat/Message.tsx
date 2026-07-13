"use client";

import { memo } from 'react';
import 'katex/dist/katex.min.css';
import { AssistantMessage } from './message/AssistantMessage';
import { UserMessage } from './message/UserMessage';
import { useMessageContent } from './message/use-message-content';
import type { MessageProps } from './message/types';

function isThinkingModel(modelMode?: string) {
  if (!modelMode) return false;
  const model = modelMode.toLowerCase();
  return model === 'openai/gpt-5.6-sol'
    || model === 'openai/gpt-5.6-terra'
    || model === 'xai/grok-4.5'
    || model.includes('glm-')
    || model.includes('medium-3.5')
    || (modelMode.startsWith('gemini') && model.includes('pro'))
    || model.includes('reasoning')
    || model.includes('gpt-oss')
    || model.includes('step-')
    || model.includes('stepfun')
    || model.includes('minimax')
    || (model.includes('nemotron') && (modelMode.includes('super') || modelMode.includes('ultra')));
}

const MessageComponent = ({
  message,
  index,
  isStreaming,
  modelMode,
  onBranchOff,
}: MessageProps) => {
  const parsed = useMessageContent(message.content);
  if (message.role === 'user') return <UserMessage message={message} />;

  const isThinkingActive = isStreaming && (
    (message.content.includes('<think>') && !message.content.includes('</think>'))
    || (isThinkingModel(modelMode)
      && !message.content.includes('</think>')
      && !parsed.rawMainContent.trim())
  );
  return (
    <AssistantMessage
      parsed={parsed}
      rawContent={message.content}
      index={index}
      isStreaming={isStreaming}
      isThinkingActive={isThinkingActive}
      onBranchOff={onBranchOff}
    />
  );
};

export const Message = memo(MessageComponent, (previous, next) => (
  previous.message.content === next.message.content
  && previous.index === next.index
  && previous.isStreaming === next.isStreaming
  && previous.expandedThinking.includes(previous.index) === next.expandedThinking.includes(next.index)
  && previous.onBranchOff === next.onBranchOff
  && (next.isStreaming ? previous.modelMode === next.modelMode : true)
));
