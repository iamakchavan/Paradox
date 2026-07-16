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
  return <p>{groupCitationChildren(children, context?.searchMap ?? null)}</p>;
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

const MarkdownPre = memo(({ children }: { children?: ReactNode }) => <>{children}</>);
MarkdownPre.displayName = 'MarkdownPre';

const MarkdownTableHead = memo(({ children }: { children?: ReactNode }) => (
  <thead className="bg-zinc-50/90 text-zinc-600 dark:bg-white/[0.035] dark:text-zinc-300">
    {children}
  </thead>
));
MarkdownTableHead.displayName = 'MarkdownTableHead';

const MarkdownTableBody = memo(({ children }: { children?: ReactNode }) => (
  <tbody className="bg-white dark:bg-zinc-950 [&>tr:nth-child(even)]:bg-zinc-50/45 dark:[&>tr:nth-child(even)]:bg-white/[0.012] [&>tr:not(:last-child)>*]:border-b [&>tr:not(:last-child)>*]:border-zinc-200/65 dark:[&>tr:not(:last-child)>*]:border-white/[0.065]">
    {children}
  </tbody>
));
MarkdownTableBody.displayName = 'MarkdownTableBody';

const MarkdownTableRow = memo(({ children }: { children?: ReactNode }) => <tr>{children}</tr>);
MarkdownTableRow.displayName = 'MarkdownTableRow';

const MarkdownTableHeaderCell = memo(({ children, style, ...props }: any) => (
  <th
    className="min-w-[13rem] max-w-[30rem] whitespace-normal break-words border-b border-zinc-200/75 px-4 py-2.5 text-left text-[11.5px] font-medium leading-4 tracking-normal text-zinc-600 first:min-w-[9rem] first:max-w-[14rem] dark:border-white/[0.075] dark:text-zinc-300 [overflow-wrap:anywhere]"
    style={{ ...style, ...props.style, textAlign: 'left' }}
    {...props}
  >
    {children}
  </th>
));
MarkdownTableHeaderCell.displayName = 'MarkdownTableHeaderCell';

const MarkdownTableCell = memo(({ children, style, ...props }: any) => (
  <td
    className="min-w-[13rem] max-w-[30rem] whitespace-normal break-words px-4 py-3 text-left align-top text-[13px] leading-[1.55] text-zinc-600 first:min-w-[9rem] first:max-w-[14rem] first:font-medium first:text-zinc-800 dark:text-zinc-400 dark:first:text-zinc-200 [overflow-wrap:anywhere]"
    style={{ ...style, ...props.style, textAlign: 'left' }}
    {...props}
  >
    {children}
  </td>
));
MarkdownTableCell.displayName = 'MarkdownTableCell';

const markdownComponents = {
  a: MarkdownLink,
  p: MarkdownParagraph,
  li: MarkdownListItem,
  pre: MarkdownPre,
  table: MarkdownTable,
  thead: MarkdownTableHead,
  tbody: MarkdownTableBody,
  tr: MarkdownTableRow,
  th: MarkdownTableHeaderCell,
  td: MarkdownTableCell,
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
            className="typeset typeset-chat max-w-none"
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
