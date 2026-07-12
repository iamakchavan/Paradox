"use client";

import { memo, useMemo, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { TableWrapper } from '../TableWrapper';
import { CodeBlock } from '../CodeBlock';
import { GenerativeUIRegistry } from '../generative-ui/registry';
import { parseGenerativeUIContent } from '@/utils/generative-ui-parser';
import { groupCitationChildren, MarkdownLink } from './citation-pills';
import { MessageMarkdownContext, useMessageMarkdownContext } from './markdown-context';

const MarkdownParagraph = memo(({ children }: { children?: ReactNode }) => {
  const context = useMessageMarkdownContext();
  return <p className="mb-4 last:mb-0">{groupCitationChildren(children, context?.searchMap ?? null)}</p>;
});
MarkdownParagraph.displayName = 'MarkdownParagraph';

const MarkdownListItem = memo(({ children }: { children?: ReactNode }) => {
  const context = useMessageMarkdownContext();
  return <li>{groupCitationChildren(children, context?.searchMap ?? null)}</li>;
});
MarkdownListItem.displayName = 'MarkdownListItem';

const MarkdownTable = memo(({ children }: { children?: ReactNode }) => {
  const context = useMessageMarkdownContext();
  return (
    <TableWrapper isStreaming={context?.isStreaming ?? false} messageContent={context?.messageContent ?? ''}>
      {children}
    </TableWrapper>
  );
});
MarkdownTable.displayName = 'MarkdownTable';

const MarkdownCode = memo(({ className, children, ...props }: any) => {
  const context = useMessageMarkdownContext();
  const match = /language-(\w+)/.exec(className || '');
  if (!match) {
    return <code {...props} className="bg-secondary/30 px-1.5 py-0.5 rounded-md text-[0.9em]">{children}</code>;
  }
  return (
    <CodeBlock
      language={match[1]}
      codeString={String(children).replace(/\n$/, '')}
      index={context?.messageIndex ?? 0}
      isStreaming={context?.isStreaming ?? false}
    />
  );
});
MarkdownCode.displayName = 'MarkdownCode';

const markdownComponents = {
  a: MarkdownLink,
  p: MarkdownParagraph,
  li: MarkdownListItem,
  pre: memo(({ children }: { children?: ReactNode }) => <>{children}</>),
  table: MarkdownTable,
  thead: memo(({ children }: { children?: ReactNode }) => <thead className="bg-transparent">{children}</thead>),
  tbody: memo(({ children }: { children?: ReactNode }) => (
    <tbody className="divide-y divide-zinc-200/30 dark:divide-zinc-800/20">{children}</tbody>
  )),
  tr: memo(({ children }: { children?: ReactNode }) => (
    <tr className="transition-colors hover:bg-zinc-50/15 dark:hover:bg-white/[0.002]">{children}</tr>
  )),
  th: memo(({ children, style, ...props }: any) => (
    <th
      className="px-3 py-2 text-left text-[11px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10"
      style={{ ...style, ...props.style, textAlign: 'left' }}
      {...props}
    >
      {children}
    </th>
  )),
  td: memo(({ children, style, ...props }: any) => (
    <td
      className="px-3 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 align-top leading-normal"
      style={{ ...style, ...props.style, textAlign: 'left' }}
      {...props}
    >
      {children}
    </td>
  )),
  code: MarkdownCode,
};

interface MessageMarkdownProps {
  content: string;
  searchMap: Map<string, { title: string; content: string }> | null;
  isStreaming: boolean;
  messageContent: string;
  messageIndex: number;
}

export const MessageMarkdown = memo((props: MessageMarkdownProps) => {
  const context = useMemo(() => ({
    searchMap: props.searchMap,
    isStreaming: props.isStreaming,
    messageContent: props.messageContent,
    messageIndex: props.messageIndex,
  }), [props.isStreaming, props.messageContent, props.messageIndex, props.searchMap]);
  const groups = useMemo(() => {
    const { blocks } = parseGenerativeUIContent(props.content);
    const output: Array<
      | { type: 'markdown'; content: string }
      | { type: 'components'; items: Array<{ componentName: string; props: any }> }
    > = [];
    blocks.forEach(block => {
      if (block.type === 'component' && block.componentName) {
        const last = output[output.length - 1];
        const item = { componentName: block.componentName, props: block.props };
        if (last?.type === 'components') last.items.push(item);
        else output.push({ type: 'components', items: [item] });
      } else if (!block.content || block.content.trim() !== '') {
        output.push({ type: 'markdown', content: block.content });
      }
    });
    return output;
  }, [props.content]);

  return (
    <MessageMarkdownContext.Provider value={context}>
      {groups.map((group, index) => {
        if (group.type === 'components') {
          return (
            <div key={index} className="flex flex-wrap gap-3.5 items-stretch my-4 animate-in fade-in-50 duration-200">
              {group.items.map((item, itemIndex) => {
                const Component = GenerativeUIRegistry[item.componentName as keyof typeof GenerativeUIRegistry] as React.ComponentType<any>;
                return Component ? <Component key={itemIndex} {...item.props} /> : null;
              })}
            </div>
          );
        }
        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            className="prose dark:prose-invert max-w-none prose-pre:p-0 break-words"
            components={markdownComponents}
          >
            {group.content}
          </ReactMarkdown>
        );
      })}
    </MessageMarkdownContext.Provider>
  );
});
MessageMarkdown.displayName = 'MessageMarkdown';
