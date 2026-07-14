"use client";

import {
  Children,
  isValidElement,
  memo,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileBackDismiss } from '@/hooks/use-mobile-back-dismiss';
import { FaviconImage } from '../FaviconImage';
import { SourcesSheetHeader } from '../SourcesSheetHeader';
import { useMessageMarkdownContext } from './markdown-context';
import { extractSiteName, getCleanUrl } from './url-utils';

interface CitationItem {
  href: string;
  domain: string;
  label: string;
}

type SearchMap = Map<string, { title: string; content: string }> | null;

function findSearchResult(item: CitationItem | undefined, searchMap: SearchMap) {
  if (!item || !searchMap) return null;
  const pathMatch = searchMap.get(getCleanUrl(item.href));
  if (pathMatch) return pathMatch;
  try {
    return searchMap.get(new URL(item.href).hostname.replace('www.', '').toLowerCase()) ?? null;
  } catch {
    return null;
  }
}

const SingleCitationPill = memo(({ item, searchMap }: { item: CitationItem; searchMap: SearchMap }) => {
  const matchedResult = useMemo(() => findSearchResult(item, searchMap), [item.href, searchMap]);
  const siteName = useMemo(
    () => matchedResult ? extractSiteName(matchedResult.title) : null,
    [matchedResult],
  );
  const displayLabel = siteName ?? (/^\d+$/.test(item.label.trim()) ? item.domain : (item.label || item.domain));
  const pill = (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="not-typeset inline-flex items-center px-2 py-px mx-0.5 text-[10px] font-medium rounded-full bg-zinc-200/70 hover:bg-zinc-200/90 dark:bg-white/[0.105] dark:hover:bg-white/[0.15] border border-zinc-950/[0.04] dark:border-white/[0.06] text-foreground/70 dark:text-zinc-200/80 transition-[background-color,color,border-color,transform] duration-200 hover:scale-[1.02] motion-reduce:transform-none select-none cursor-pointer no-underline align-[0.08em] leading-[1.35]"
      style={{ color: 'unset', textDecoration: 'none' }}
    >
      <span className="truncate max-w-[104px] font-medium">{displayLabel}</span>
    </a>
  );
  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger asChild>{pill}</HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="hidden sm:block z-50 w-80 p-3.5 bg-popover border border-border/60 rounded-xl shadow-lg select-none pointer-events-auto animate-in fade-in-0 zoom-in-95"
      >
        <div className="flex flex-col text-xs gap-1.5">
          <div className="flex items-center gap-1.5">
            <FaviconImage domain={item.domain} className="w-3.5 h-3.5 rounded-sm shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate flex-1">{siteName ?? item.domain}</span>
          </div>
          {matchedResult ? (
            <>
              <h4 className="font-serif font-normal text-foreground text-[13px] leading-snug line-clamp-2 mt-0.5">
                {matchedResult.title}
              </h4>
              <p className="text-muted-foreground/90 leading-normal line-clamp-3 text-[11px] font-normal">
                {matchedResult.content}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground/70 break-all leading-relaxed mt-0.5">{item.href}</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});
SingleCitationPill.displayName = 'SingleCitationPill';

const GroupedCitationPill = memo(({ items, searchMap }: { items: CitationItem[]; searchMap: SearchMap }) => {
  const [page, setPage] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const current = items[page];
  const first = items[0];
  const currentResult = useMemo(() => findSearchResult(current, searchMap), [current?.href, searchMap]);
  const firstResult = useMemo(() => findSearchResult(first, searchMap), [first?.href, searchMap]);
  useMobileBackDismiss({
    isOpen: isDrawerOpen,
    isMobile,
    stateKey: 'paradoxInlineSources',
    entryPrefix: 'inline-sources',
    onDismiss: () => setIsDrawerOpen(false),
  });
  if (!current) return null;
  const firstSiteName = firstResult ? (extractSiteName(firstResult.title) ?? first.domain) : first.domain;
  const currentSiteName = currentResult ? (extractSiteName(currentResult.title) ?? current.domain) : current.domain;
  const description = `${items.length} ${items.length === 1 ? 'source' : 'sources'} cited in this answer`;
  const trigger = (
    <button
      type="button"
      onClick={event => {
        if (window.innerWidth < 640) {
          event.preventDefault();
          event.stopPropagation();
          setIsDrawerOpen(true);
        }
      }}
      className="not-typeset inline-flex items-center gap-1 px-2 py-px mx-0.5 text-[10px] font-medium rounded-full bg-zinc-200/70 hover:bg-zinc-200/90 dark:bg-white/[0.105] dark:hover:bg-white/[0.15] border border-zinc-950/[0.04] dark:border-white/[0.06] text-foreground/70 hover:text-foreground dark:text-zinc-200/80 dark:hover:text-zinc-100 transition-[background-color,color,border-color,transform] duration-200 hover:scale-[1.02] motion-reduce:transform-none select-none cursor-pointer align-[0.08em] leading-[1.35]"
    >
      <span className="truncate max-w-[92px] font-medium">{firstSiteName}</span>
      <span className="text-foreground/50 font-medium leading-none">+{items.length - 1}</span>
    </button>
  );
  return (
    <>
      <HoverCard openDelay={150}>
        <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
        <HoverCardContent
          side="bottom"
          align="start"
          sideOffset={6}
          className="hidden sm:flex sm:flex-col z-50 w-80 bg-popover border border-border/60 rounded-xl shadow-lg pointer-events-auto animate-in fade-in-0 zoom-in-95 overflow-hidden p-0"
        >
          <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-border/40">
            <div className="flex items-center gap-0.5">
              <button
                onClick={event => { event.preventDefault(); setPage(previous => Math.max(0, previous - 1)); }}
                disabled={page === 0}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-secondary/70 disabled:opacity-25 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={event => { event.preventDefault(); setPage(previous => Math.min(items.length - 1, previous + 1)); }}
                disabled={page === items.length - 1}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-secondary/70 disabled:opacity-25 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{page + 1}/{items.length}</span>
          </div>
          <a
            href={current.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-1.5 px-3.5 py-3 no-underline hover:bg-secondary/20 transition-colors"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-center gap-1.5">
              <FaviconImage domain={current.domain} className="w-4 h-4 rounded-sm shrink-0" />
              <span className="text-[11px] font-semibold text-foreground truncate flex-1">{currentSiteName}</span>
            </div>
            {currentResult ? (
              <>
                <h4 className="font-serif font-normal text-foreground text-[13px] leading-snug line-clamp-2">{currentResult.title}</h4>
                <p className="text-muted-foreground/80 text-[11px] leading-relaxed line-clamp-3">{currentResult.content}</p>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground/70 break-all leading-relaxed">{current.href}</p>
            )}
          </a>
        </HoverCardContent>
      </HoverCard>
      <MobileBottomSheet
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        title="Sources"
        description={description}
        className="h-[80dvh] min-h-[300px] select-none"
      >
        <SourcesSheetHeader description={description} onClose={() => setIsDrawerOpen(false)} />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-[72px] divide-y divide-border/30">
          {items.map((item, index) => {
            const result = findSearchResult(item, searchMap);
            return (
              <a
                key={index}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 py-4 no-underline active:opacity-70 transition-opacity duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] select-none"
                onClick={() => setIsDrawerOpen(false)}
              >
                <div className="flex items-center justify-between w-full min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FaviconImage domain={item.domain} className="w-3.5 h-3.5 rounded-sm shrink-0" />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 truncate">{item.domain}</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                </div>
                {result ? (
                  <div className="flex flex-col gap-1">
                    <h4 className="font-serif font-normal text-foreground text-[13px] leading-snug line-clamp-2">{result.title}</h4>
                    <p className="text-muted-foreground/90 leading-normal line-clamp-3 text-[11px] font-normal">{result.content}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground/75 break-all leading-normal">{item.href}</p>
                )}
              </a>
            );
          })}
        </div>
      </MobileBottomSheet>
    </>
  );
});
GroupedCitationPill.displayName = 'GroupedCitationPill';

export const MarkdownLink = memo(({ href, children }: { href?: string; children?: ReactNode }) => {
  const context = useMessageMarkdownContext();
  if (!href) return null;
  if (href.startsWith('http://') || href.startsWith('https://')) {
    let domain = '';
    try { domain = new URL(href).hostname.replace('www.', ''); } catch { domain = href; }
    const label = String(children || '').trim();
    const citation = /^\d+$/.test(label)
      || (label.length <= 40 && !/\s{2,}/.test(label) && (label === domain || label.includes('.') || label === ''))
      || label === '';
    if (citation) {
      return <SingleCitationPill item={{ href, domain, label }} searchMap={context?.searchMap ?? null} />;
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline decoration-primary/40 underline-offset-2">
        {children}
      </a>
    );
  }
  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>;
});
MarkdownLink.displayName = 'MarkdownLink';

export function groupCitationChildren(children: ReactNode, searchMap: SearchMap): ReactNode[] {
  const childArray = Children.toArray(children);
  const output: ReactNode[] = [];
  const isCitation = (child: ReactNode): child is ReactElement<{ href?: string; children?: ReactNode }> => {
    if (!isValidElement(child)) return false;
    const type = child.type as { displayName?: string };
    if (type !== MarkdownLink && type?.displayName !== 'MarkdownLink') return false;
    const href = child.props.href || '';
    if (!href.startsWith('http://') && !href.startsWith('https://')) return false;
    const label = String(child.props.children || '').trim();
    return /^\d+$/.test(label) || (label.length <= 40 && (label.includes('.') || label === '')) || label === '';
  };
  const itemFrom = (child: ReactElement<{ href?: string; children?: ReactNode }>): CitationItem => {
    const href = child.props.href || '';
    let domain = '';
    try { domain = new URL(href).hostname.replace('www.', ''); } catch { domain = href; }
    return { href, domain, label: String(child.props.children || '').trim() };
  };
  const separator = (child: ReactNode) => typeof child === 'string' && /^[\s,;.\u00a0]*$/.test(child);

  let index = 0;
  while (index < childArray.length) {
    const child = childArray[index];
    if (!isCitation(child)) {
      output.push(child);
      index++;
      continue;
    }
    const run: CitationItem[] = [];
    const trailingSeparators: ReactNode[] = [];
    let cursor = index;
    while (cursor < childArray.length) {
      const candidate = childArray[cursor];
      if (separator(candidate)) {
        trailingSeparators.push(candidate);
        cursor++;
      } else if (isCitation(candidate)) {
        run.push(itemFrom(candidate));
        trailingSeparators.length = 0;
        cursor++;
      } else {
        break;
      }
    }
    if (run.length <= 1) {
      output.push(child);
      index++;
    } else {
      output.push(<GroupedCitationPill key={`cg-${index}`} items={run} searchMap={searchMap} />);
      trailingSeparators.forEach(value => output.push(value));
      index = cursor;
    }
  }
  return output;
}
