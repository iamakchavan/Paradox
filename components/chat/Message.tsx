import { useState, useRef, useEffect, useMemo, memo, createContext, useContext, Children, isValidElement } from 'react';
import { ChevronDown, FileText, Globe, Search, ShieldAlert, Loader2, ChevronLeft, ChevronRight, ExternalLink, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import { TableWrapper } from './TableWrapper';
import { preprocessLaTeX } from '@/utils/latex';
import { CodeBlock } from './CodeBlock';
import { db } from '@/lib/db';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useCustomToast } from '@/components/ui/custom-toast';
import { parseResearchStream, ResearchStep } from '@/lib/research/parser';
import { ResearchTimeline } from './ResearchTimeline';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
} from '@/components/ui/tooltip';

interface MessageProps {
  message: {
    id?: number;
    role: 'user' | 'assistant';
    content: string;
    images?: string[];
    pdfs?: { name: string; data: string }[];
  };
  index: number;
  isStreaming: boolean;
  expandedThinking: number[];
  setExpandedThinking: (value: (prev: number[]) => number[]) => void;
  modelMode?: string;
  onBranchOff?: (index: number) => void;
}

interface MessageContextValue {
  searchMap: Map<string, { title: string; content: string }> | null;
  isStreaming: boolean;
  messageContent: string;
  messageIndex: number;
}

const MessageContext = createContext<MessageContextValue | null>(null);

// Memory cache for synchronous lookups during render/mounts to prevent visual blinking
const memoryFaviconCache = new Map<string, string>();

// Track pending favicon network or DB requests to deduplicate concurrent lookups
const pendingFavicons = new Map<string, Promise<string | null>>();

// Helper to get and fetch favicon with full deduplication across all instances
const getFavicon = (domain: string): Promise<string | null> => {
  const memCached = memoryFaviconCache.get(domain);
  if (memCached) {
    return Promise.resolve(memCached === 'FAILED' ? null : memCached);
  }

  let pending = pendingFavicons.get(domain);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    try {
      // 1. Check IndexedDB cache
      const cached = await db.favicons.get(domain);
      if (cached) {
        if (Date.now() - cached.createdAt < 7 * 24 * 60 * 60 * 1000) {
          memoryFaviconCache.set(domain, cached.dataUrl);
          return cached.dataUrl === 'FAILED' ? null : cached.dataUrl;
        }
      }

      // 2. Fetch via proxy from Google Favicon API
      const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      const proxiedFavicon = `/api/proxy-image?url=${encodeURIComponent(googleFavicon)}`;

      const res = await fetch(proxiedFavicon);
      if (!res.ok) {
        memoryFaviconCache.set(domain, 'FAILED');
        try {
          await db.favicons.put({ domain, dataUrl: 'FAILED', createdAt: Date.now() });
        } catch (dbErr) {
          console.warn('Failed to cache failed favicon in IndexedDB:', dbErr);
        }
        return null;
      }

      const blob = await res.blob();
      const base64data = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });

      if (base64data) {
        memoryFaviconCache.set(domain, base64data);
        try {
          await db.favicons.put({ domain, dataUrl: base64data, createdAt: Date.now() });
        } catch (dbErr) {
          console.warn('Failed to store favicon in IndexedDB:', dbErr);
        }
        return base64data;
      } else {
        memoryFaviconCache.set(domain, 'FAILED');
        try {
          await db.favicons.put({ domain, dataUrl: 'FAILED', createdAt: Date.now() });
        } catch (dbErr) {
          console.warn('Failed to cache failed favicon in IndexedDB:', dbErr);
        }
        return null;
      }
    } catch (err) {
      console.warn('Error fetching favicon for domain:', domain, err);
      memoryFaviconCache.set(domain, 'FAILED');
      try {
        await db.favicons.put({ domain, dataUrl: 'FAILED', createdAt: Date.now() });
      } catch (dbErr) {
        console.warn('Failed to cache failed favicon in IndexedDB:', dbErr);
      }
      return null;
    } finally {
      pendingFavicons.delete(domain);
    }
  })();

  pendingFavicons.set(domain, promise);
  return promise;
};

// Component to load and render favicon from IndexedDB cache or external fallback
export const FaviconImage = memo(({ domain, className }: { domain: string; className?: string }) => {
  // Initialize state synchronously from in-memory cache to prevent flickering on remounts
  const [src, setSrc] = useState<string | null>(() => {
    const cached = memoryFaviconCache.get(domain);
    return cached && cached !== 'FAILED' ? cached : null;
  });
  const [error, setError] = useState(() => {
    return memoryFaviconCache.get(domain) === 'FAILED';
  });

  useEffect(() => {
    const cached = memoryFaviconCache.get(domain);
    if (cached) {
      if (cached === 'FAILED') {
        setError(true);
      } else {
        setSrc(cached);
        setError(false);
      }
      return;
    }

    let active = true;
    getFavicon(domain).then((data) => {
      if (!active) return;
      if (data) {
        setSrc(data);
        setError(false);
      } else {
        setError(true);
      }
    });

    return () => {
      active = false;
    };
  }, [domain]);

  if (error || !src) {
    return <Globe className={cn("text-muted-foreground/70", className)} />;
  }

  return (
    <img
      src={src}
      alt=""
      className={cn("object-contain shrink-0", className)}
      style={{ margin: 0 }}
      onError={() => setError(true)}
    />
  );
});
FaviconImage.displayName = 'FaviconImage';

// Styled citation pill component (used in WebSearchWidget source cards)
const CitationPill = memo(({ href, domain, label }: { href: string; domain: string; label: string }) => {
  const isNumeric = /^\d+$/.test(label.trim());
  const displayLabel = isNumeric ? domain : label;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 text-[11px] font-medium rounded-full bg-secondary/80 hover:bg-secondary border border-border/50 transition-all duration-200 hover:scale-[1.03] select-none shadow-sm cursor-pointer no-underline align-middle"
      style={{ color: 'unset', textDecoration: 'none' }}
    >
      <FaviconImage domain={domain} className="w-3 h-3 rounded-sm shrink-0" />
      <span className="truncate max-w-[100px] font-medium text-foreground/75">{displayLabel}</span>
    </a>
  );
});
CitationPill.displayName = 'CitationPill';

// ─── URL normalizer ───────────────────────────────────────────────────────
const getCleanUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return (parsed.hostname + parsed.pathname).replace(/\/$/, '').toLowerCase();
  } catch {
    return url.trim().replace(/\/$/, '').toLowerCase();
  }
};

// Helper to extract a human-readable site name from a page title.
// Most sites format titles as "Article Title | Site Name" or "Article Title - Site Name".
// We grab the last segment after the final " | " or " – " or " - " separator.
const extractSiteName = (title: string): string | null => {
  if (!title) return null;
  const separators = [' | ', ' – ', ' — ', ' - '];
  for (const sep of separators) {
    const idx = title.lastIndexOf(sep);
    if (idx !== -1) {
      const candidate = title.substring(idx + sep.length).trim();
      // A real site name: short (≤25 chars), no commas, not all numbers
      if (
        candidate.length >= 2 &&
        candidate.length <= 25 &&
        !candidate.includes(',') &&
        !/^\d+$/.test(candidate)
      ) {
        return candidate;
      }
    }
  }
  return null;
};
const linkifyCitations = (content: string, results?: Array<{ url: string }>) => {
  if (!results || results.length === 0) return content;
  
  return content.replace(/\[(\d+)\](?!\()/g, (match, numStr) => {
    const index = parseInt(numStr, 10) - 1;
    if (index >= 0 && index < results.length) {
      const result = results[index];
      if (result && result.url) {
        return `[${numStr}](${result.url})`;
      }
    }
    return match;
  });
};

const cleanMarkdownCitations = (text: string): string => {
  if (!text) return text;
  return text.replace(/\[([^\]]+)\]\s*\(\s*(https?:\/\/[^)]+)\)/gi, (match, label, url) => {
    const cleanUrl = url.replace(/\s+/g, '');
    let cleanLabel = label.trim();
    const tempLabel = cleanLabel.replace(/\s+/g, '');
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,10}$/.test(tempLabel)) {
      cleanLabel = tempLabel;
    }
    return `[${cleanLabel}](${cleanUrl})`;
  });
};

const autoCloseMarkdownLinks = (text: string): string => {
  if (!text) return text;
  const lastOpenBracket = text.lastIndexOf('[');
  if (lastOpenBracket === -1) return text;

  const lastCloseBracket = text.lastIndexOf(']');
  const lastOpenParen = text.lastIndexOf('(');
  const lastCloseParen = text.lastIndexOf(')');

  if (lastOpenParen > lastCloseBracket && lastCloseBracket > lastOpenBracket && lastOpenParen > lastCloseParen) {
    return text + ')';
  }
  return text;
};

// ─── Single citation pill with optional hover preview ────────────────────
const SingleCitationPill = memo(({ item, searchMap }: {
  item: { href: string; domain: string; label: string };
  searchMap: Map<string, { title: string; content: string }> | null;
}) => {
  const { href, domain, label } = item;
  const isNumeric = /^\d+$/.test(label.trim());

  const matchedResult = useMemo(() => {
    if (!searchMap) return null;
    // Try full path first, then domain-only fallback
    const byPath = searchMap.get(getCleanUrl(href));
    if (byPath) return byPath;
    try {
      const domain = new URL(href).hostname.replace('www.', '').toLowerCase();
      return searchMap.get(domain) ?? null;
    } catch { return null; }
  }, [href, searchMap]);

  // Prefer: extracted site name from title > raw label if not numeric > domain
  const siteName = useMemo(() =>
    matchedResult ? (extractSiteName(matchedResult.title) ?? null) : null,
    [matchedResult]
  );
  const displayLabel = siteName ?? (isNumeric ? domain : (label || domain));

  const pill = (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-2.5 py-0.5 mx-0.5 text-[11px] font-medium rounded-full bg-secondary/80 hover:bg-secondary border border-border/50 transition-all duration-200 hover:scale-[1.03] select-none shadow-sm cursor-pointer no-underline align-middle"
      style={{ color: 'unset', textDecoration: 'none' }}
    >
      <span className="truncate max-w-[120px] font-medium text-foreground/75">{displayLabel}</span>
    </a>
  );

  // Always show a hover popup — with rich data if available, URL fallback if not
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
            <FaviconImage domain={domain} className="w-3.5 h-3.5 rounded-sm shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate flex-1">{siteName ?? domain}</span>
          </div>
          {matchedResult ? (
            <>
              <h4 className="font-serif font-semibold text-foreground text-[13px] leading-snug line-clamp-2 mt-0.5">
                {matchedResult.title}
              </h4>
              <p className="text-muted-foreground/90 leading-normal line-clamp-3 text-[11px] font-normal">
                {matchedResult.content}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground/70 break-all leading-relaxed mt-0.5">
              {href}
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
});
SingleCitationPill.displayName = 'SingleCitationPill';

// ─── Grouped citation pill: ONE pill showing "domain +N" for N≥2 sources ──
// Shows favicon + first domain name + "+N" count. Hover opens paginated popup.
const GroupedCitationPill = memo(({ items, searchMap }: {
  items: Array<{ href: string; domain: string; label: string }>;
  searchMap: Map<string, { title: string; content: string }> | null;
}) => {
  const [page, setPage] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const total = items.length;
  const current = items[page];
  const first = items[0];
  const extraCount = total - 1;

  // Synchronize history state to dismiss drawer on mobile browser back button / back gestures
  useEffect(() => {
    if (!isDrawerOpen) return;

    // Push a dummy state to history so that a back gesture pops this state instead of navigating away
    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = () => {
      setIsDrawerOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    };
  }, [isDrawerOpen]);

  // Recompute matched result whenever page changes
  const matchedResult = useMemo(() => {
    if (!current || !searchMap) return null;
    const byPath = searchMap.get(getCleanUrl(current.href));
    if (byPath) return byPath;
    try {
      const domain = new URL(current.href).hostname.replace('www.', '').toLowerCase();
      return searchMap.get(domain) ?? null;
    } catch { return null; }
  }, [searchMap, current?.href]);

  // Site name for the trigger pill (first item)
  const firstMatchedResult = useMemo(() => {
    if (!first || !searchMap) return null;
    const byPath = searchMap.get(getCleanUrl(first.href));
    if (byPath) return byPath;
    try {
      const domain = new URL(first.href).hostname.replace('www.', '').toLowerCase();
      return searchMap.get(domain) ?? null;
    } catch { return null; }
  }, [searchMap, first?.href]);

  if (!current) return null;

  const firstSiteName = firstMatchedResult
    ? (extractSiteName(firstMatchedResult.title) ?? first.domain)
    : first.domain;

  // Site name for the currently viewed card in the popup
  const currentSiteName = matchedResult
    ? (extractSiteName(matchedResult.title) ?? current.domain)
    : current.domain;

  const handlePillClick = (e: React.MouseEvent) => {
    if (window.innerWidth < 640) {
      e.preventDefault();
      e.stopPropagation();
      setIsDrawerOpen(true);
    }
  };

  const triggerPill = (
    <button
      type="button"
      onClick={handlePillClick}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 text-[11px] font-medium rounded-full bg-secondary/80 hover:bg-secondary border border-border/50 text-foreground/75 hover:text-foreground transition-all duration-200 hover:scale-[1.03] select-none shadow-sm cursor-pointer align-middle"
    >
      <span className="truncate max-w-[100px] font-medium">{firstSiteName}</span>
      <span className="text-foreground/50 font-medium leading-none">+{extraCount}</span>
    </button>
  );

  return (
    <>
      <HoverCard openDelay={150}>
        <HoverCardTrigger asChild>{triggerPill}</HoverCardTrigger>
        <HoverCardContent
          side="bottom"
          align="start"
          sideOffset={6}
          className="hidden sm:flex sm:flex-col z-50 w-80 bg-popover border border-border/60 rounded-xl shadow-lg pointer-events-auto animate-in fade-in-0 zoom-in-95 overflow-hidden p-0"
        >
          {/* Header: chevron nav + page counter */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-border/40">
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => { e.preventDefault(); setPage(p => Math.max(0, p - 1)); }}
                disabled={page === 0}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-secondary/70 disabled:opacity-25 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setPage(p => Math.min(total - 1, p + 1)); }}
                disabled={page === total - 1}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-secondary/70 disabled:opacity-25 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
              {page + 1}/{total}
            </span>
          </div>

          {/* Source card — links to the current page's source */}
          <a
            href={current.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-1.5 px-3.5 py-3 no-underline hover:bg-secondary/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5">
              <FaviconImage domain={current.domain} className="w-4 h-4 rounded-sm shrink-0" />
              <span className="text-[11px] font-semibold text-foreground truncate flex-1">{currentSiteName}</span>
            </div>
            {matchedResult ? (
              <>
                <h4 className="font-serif font-semibold text-foreground text-[13px] leading-snug line-clamp-2">
                  {matchedResult.title}
                </h4>
                <p className="text-muted-foreground/80 text-[11px] leading-relaxed line-clamp-3">
                  {matchedResult.content}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground/70 break-all leading-relaxed">
                {current.href}
              </p>
            )}
          </a>
        </HoverCardContent>
      </HoverCard>

      {/* Mobile Drawer (Bottom Sheet) */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[80vh] p-0 flex flex-col bg-background rounded-t-[24px] select-none border-t border-border/40 shadow-2xl">
          <DrawerHeader className="px-6 pt-6 pb-4 border-b border-border/40 text-left shrink-0">
            <div className="flex items-center gap-2">
              <DrawerTitle className="font-serif text-lg font-bold tracking-tight text-foreground">
                Sources
              </DrawerTitle>
              <span className="bg-secondary text-secondary-foreground font-semibold px-2 py-0.5 text-[10px] rounded-full">
                {total}
              </span>
            </div>
          </DrawerHeader>

          {/* List of citation items scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-2 divide-y divide-border/30">
            {items.map((item, idx) => {
              const matched = searchMap ? (searchMap.get(getCleanUrl(item.href)) || (() => {
                try {
                  const dom = new URL(item.href).hostname.replace('www.', '').toLowerCase();
                  return searchMap.get(dom) ?? null;
                } catch { return null; }
              })()) : null;

              const siteName = matched ? (extractSiteName(matched.title) ?? item.domain) : item.domain;

              return (
                <a
                  key={idx}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1.5 py-4 no-underline active:opacity-70 transition-all select-none"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <div className="flex items-center justify-between w-full min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FaviconImage domain={item.domain} className="w-3.5 h-3.5 rounded-sm shrink-0" />
                      <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 truncate">{item.domain}</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                  </div>
                  {matched ? (
                    <div className="flex flex-col gap-1">
                      <h4 className="font-serif font-semibold text-foreground text-[13px] leading-snug line-clamp-2">
                        {matched.title}
                      </h4>
                      <p className="text-muted-foreground/90 leading-normal line-clamp-3 text-[11px] font-normal">
                        {matched.content}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/75 break-all leading-normal">
                      {item.href}
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
});
GroupedCitationPill.displayName = 'GroupedCitationPill';

// ─── Legacy LinkCitation (wraps SingleCitationPill) ───────────────────────
const LinkCitation = memo(({ href, domain, label, searchMap }: {
  href: string; domain: string; label: string;
  searchMap: Map<string, { title: string; content: string }> | null;
}) => <SingleCitationPill item={{ href, domain, label }} searchMap={searchMap} />);
LinkCitation.displayName = 'LinkCitation';

// ─── MarkdownLink: per-link renderer called by react-markdown ─────────────
// Citation links: numeric labels [1], domain-only labels, or short labels (≤30 chars that look like a domain/source)
// Prose links: descriptive anchor text — kept as regular styled hyperlinks
const MarkdownLink = memo(({ href, children }: { href?: string; children?: React.ReactNode }) => {
  const context = useContext(MessageContext);
  if (!href) return null;

  if (href.startsWith('http://') || href.startsWith('https://')) {
    let domain = '';
    try { domain = new URL(href).hostname.replace('www.', ''); } catch { domain = href; }

    const label = String(children || '').trim();
    // Treat as a citation pill if:
    // 1. Label is numeric (e.g. [1] → "1")
    // 2. Label matches or closely resembles a domain (no spaces, contains a dot, short)
    // 3. Label is empty
    const isNumericLabel = /^\d+$/.test(label);
    const isDomainLikeLabel = label.length <= 40 && !/\s{2,}/.test(label) && (label === domain || label.includes('.') || label === '');
    const isCitationLink = isNumericLabel || isDomainLikeLabel || label === '';

    if (isCitationLink) {
      return (
        <SingleCitationPill
          item={{ href, domain, label }}
          searchMap={context?.searchMap ?? null}
        />
      );
    }

    // Prose link — render as styled text hyperlink
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline decoration-primary/40 underline-offset-2"
      >
        {children}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
      {children}
    </a>
  );
});
MarkdownLink.displayName = 'MarkdownLink';

// ─── Shared helper: groups consecutive citation link children ─────────────
// react-markdown passes <MarkdownLink href="..."> elements as children of p/li,
// NOT the already-rendered <SingleCitationPill>. We must detect MarkdownLink
// elements, check if they are citation-type, and group consecutive ones.
const groupCitationChildren = (
  children: React.ReactNode,
  searchMap: Map<string, { title: string; content: string }> | null
): React.ReactNode[] => {
  const childArray = Children.toArray(children);
  const output: React.ReactNode[] = [];
  let i = 0;

  // Detect a MarkdownLink element that will render as a citation pill
  const isCitationLinkEl = (c: React.ReactNode): c is React.ReactElement<{ href?: string; children?: React.ReactNode }> => {
    if (!isValidElement(c)) return false;
    const type = c.type as any;
    const isML = type === MarkdownLink || type?.displayName === 'MarkdownLink';
    if (!isML) return false;
    const props = c.props as { href?: string; children?: React.ReactNode };
    const href = props.href || '';
    if (!href.startsWith('http://') && !href.startsWith('https://')) return false;
    const label = String(props.children || '').trim();
    const isNumericLabel = /^\d+$/.test(label);
    const isDomainLikeLabel = label.length <= 40 && (label.includes('.') || label === '');
    return isNumericLabel || isDomainLikeLabel || label === '';
  };


  // Extract citation item data from a MarkdownLink element
  const extractItem = (c: React.ReactElement<{ href?: string; children?: React.ReactNode }>) => {
    const href = c.props.href || '';
    let domain = '';
    try { domain = new URL(href).hostname.replace('www.', ''); } catch { domain = href; }
    const label = String(c.props.children || '').trim();
    return { href, domain, label };
  };

  // A string that is only whitespace / light punctuation between pills
  const isInterPillSeparator = (c: React.ReactNode): boolean =>
    typeof c === 'string' && /^[\s,;.\u00a0]*$/.test(c);

  while (i < childArray.length) {
    const child = childArray[i];

    if (isCitationLinkEl(child)) {
      const run: Array<{ href: string; domain: string; label: string }> = [];
      const separatorsBetween: React.ReactNode[] = [];
      let j = i;

      while (j < childArray.length) {
        const c = childArray[j];
        if (isInterPillSeparator(c)) {
          separatorsBetween.push(c);
          j++;
          continue;
        }
        if (isCitationLinkEl(c)) {
          run.push(extractItem(c));
          separatorsBetween.length = 0;
          j++;
        } else {
          break;
        }
      }

      if (run.length <= 1) {
        output.push(child);
        i++;
      } else {
        // All citations in the run → one merged GroupedCitationPill
        output.push(
          <GroupedCitationPill key={`cg-${i}`} items={run} searchMap={searchMap} />
        );
        separatorsBetween.forEach(s => output.push(s));
        i = j;
      }
    } else {
      output.push(child);
      i++;
    }
  }

  return output;
};

// ─── MarkdownP: groups consecutive citation pills in a paragraph ──────────
const MarkdownP = memo(({ children }: { children?: React.ReactNode }) => {
  const context = useContext(MessageContext);
  return <p className="mb-4 last:mb-0">{groupCitationChildren(children, context?.searchMap ?? null)}</p>;
});
MarkdownP.displayName = 'MarkdownP';

// ─── MarkdownLi: groups consecutive citation pills in a list item ─────────
// For tight lists: children are flat (text + pills) — group directly.
// For loose lists: react-markdown wraps li content in a <p> — MarkdownP handles it.
const MarkdownLi = memo(({ children }: { children?: React.ReactNode }) => {
  const context = useContext(MessageContext);
  return <li>{groupCitationChildren(children, context?.searchMap ?? null)}</li>;
});
MarkdownLi.displayName = 'MarkdownLi';

const MarkdownPre = memo(({ children }: { children?: React.ReactNode }) => <>{children}</>);
MarkdownPre.displayName = 'MarkdownPre';

const MarkdownTable = memo(({ children }: { children?: React.ReactNode }) => {
  const context = useContext(MessageContext);
  return (
    <TableWrapper 
      isStreaming={context?.isStreaming ?? false}
      messageContent={context?.messageContent ?? ''}
    >
      {children}
    </TableWrapper>
  );
});
MarkdownTable.displayName = 'MarkdownTable';

const MarkdownThead = memo(({ children }: { children?: React.ReactNode }) => (
  <thead className="bg-transparent">{children}</thead>
));
MarkdownThead.displayName = 'MarkdownThead';

const MarkdownTbody = memo(({ children }: { children?: React.ReactNode }) => (
  <tbody className="divide-y divide-zinc-200/30 dark:divide-zinc-800/20">{children}</tbody>
));
MarkdownTbody.displayName = 'MarkdownTbody';

const MarkdownTr = memo(({ children }: { children?: React.ReactNode }) => (
  <tr className="transition-colors hover:bg-zinc-50/15 dark:hover:bg-white/[0.002]">{children}</tr>
));
MarkdownTr.displayName = 'MarkdownTr';

const MarkdownTh = memo(({ children, style, ...props }: any) => (
  <th 
    className="px-3 py-2 text-left text-[11px] font-semibold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10"
    style={{ ...style, ...props.style, textAlign: 'left' }}
    {...props}
  >
    {children}
  </th>
));
MarkdownTh.displayName = 'MarkdownTh';

const MarkdownTd = memo(({ children, style, ...props }: any) => (
  <td 
    className="px-3 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 align-top leading-normal"
    style={{ ...style, ...props.style, textAlign: 'left' }}
    {...props}
  >
    {children}
  </td>
));
MarkdownTd.displayName = 'MarkdownTd';

const MarkdownCode = memo(({ className, children, ...props }: any) => {
  const context = useContext(MessageContext);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const isInline = !match;
  
  if (isInline) {
    return <code {...props} className="bg-secondary/30 px-1.5 py-0.5 rounded-md text-[0.9em]">{children}</code>;
  }

  const codeString = String(children).replace(/\n$/, '');
  return (
    <CodeBlock 
      language={language}
      codeString={codeString}
      index={context?.messageIndex ?? 0}
      isStreaming={context?.isStreaming ?? false}
    />
  );
});
MarkdownCode.displayName = 'MarkdownCode';

const markdownComponents = {
  a: MarkdownLink,
  p: MarkdownP,
  li: MarkdownLi,
  pre: MarkdownPre,
  table: MarkdownTable,
  thead: MarkdownThead,
  tbody: MarkdownTbody,
  tr: MarkdownTr,
  th: MarkdownTh,
  td: MarkdownTd,
  code: MarkdownCode,
};

const WebSearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" stroke="currentColor" strokeWidth={1.5}></path>
    <path d="M17.8486 6.19085C19.8605 5.81929 21.3391 5.98001 21.8291 6.76327C22.8403 8.37947 19.2594 12.0342 13.8309 14.9264C8.40242 17.8185 3.18203 18.8529 2.17085 17.2367C1.63758 16.3844 2.38148 14.9651 4 13.3897" stroke="currentColor" strokeWidth={1.5}></path>
  </svg>
);

const WebSearchWidget = memo(({ searchData }: { searchData: { query: string; results: Array<{ title: string; url: string; content: string }> } }) => {
  const [showAll, setShowAll] = useState(false);
  const { query, results } = searchData;

  if (!results || results.length === 0) {
    return (
      <div className="flex items-center gap-2.5 py-2 px-3 bg-red-50/50 dark:bg-red-950/10 border border-red-200/40 dark:border-red-900/30 rounded-xl text-xs text-red-600 dark:text-red-400 mb-4 font-medium">
        <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
        <span>No search results found for &quot;{query}&quot;</span>
      </div>
    );
  }

  const hasMoreThanFour = results.length > 4;

  return (
    <div className="w-full mb-5 rounded-2xl border border-zinc-200/85 dark:border-zinc-800/90 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md p-3.5 shadow-3xs overflow-hidden">
      {/* Search Header */}
      <div className="flex items-center justify-between pb-1.5 select-none">
        <div className="flex items-center gap-2">
          {/* Custom Web Search Logo */}
          <WebSearchIcon className="w-[18px] h-[18px] text-zinc-650 dark:text-zinc-350 shrink-0" />
          <span className="text-sm font-semibold text-foreground/90 flex items-center gap-1.5 flex-wrap">
            <span>Checked {results.length} sources</span>
            <div className="flex -space-x-1 items-center shrink-0 mr-0.5">
              {results.slice(0, 3).map((r, i) => {
                let d = r.url;
                try {
                  d = new URL(r.url).hostname.replace('www.', '');
                } catch {}
                return (
                  <div 
                    key={i} 
                    className="w-4 h-4 rounded-full border border-background bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden z-10"
                    style={{ zIndex: 3 - i }}
                  >
                    <FaviconImage domain={d} className="w-2.5 h-2.5 rounded-xs" />
                  </div>
                );
              })}
            </div>
            <span>for</span>
            <code className="bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/50 px-1.5 py-0.5 rounded font-mono text-[11px] text-zinc-800 dark:text-zinc-200 select-all max-w-[220px] truncate leading-none">{query}</code>
          </span>
        </div>
      </div>

      {/* Results Sleek Grid Box */}
      {/* Grid 1: Always visible top cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2 px-1 pb-1 -mx-1">
        {(hasMoreThanFour && !showAll ? results.slice(0, 3) : results.slice(0, 4)).map((src, idx) => {
          let domain = src.url;
          try {
            domain = new URL(src.url).hostname.replace('www.', '');
          } catch {}

          return (
            <a
              key={idx}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between h-[80px] p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-950/20 hover:bg-white dark:hover:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xs hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer"
            >
              {/* Title (Top) */}
              <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
                {src.title || domain}
              </h4>

              {/* Footer (Bottom): Favicon, Domain, Citation Index */}
              <div className="flex items-center gap-1.5 min-w-0 mt-1.5 select-none">
                <FaviconImage domain={domain} className="w-3.5 h-3.5 rounded-xs" />
                <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-medium truncate flex-1">{domain}</span>
                <span className="text-zinc-300 dark:text-zinc-700/60 font-medium shrink-0">·</span>
                <span className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0 font-mono">{idx + 1}</span>
              </div>
            </a>
          );
        })}

        {/* Expand Button Card */}
        {hasMoreThanFour && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="flex flex-col justify-between h-[80px] p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-100/50 dark:bg-zinc-900/40 hover:bg-zinc-200/50 dark:hover:bg-zinc-850/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-3xs text-left"
          >
            {/* Top: Favicons row */}
            <div className="flex items-center gap-1 select-none">
              {results.slice(3, 6).map((r, i) => {
                let d = r.url;
                try {
                  d = new URL(r.url).hostname.replace('www.', '');
                } catch {}
                return (
                  <div 
                    key={i} 
                    className="w-5 h-5 rounded-full bg-zinc-200/50 dark:bg-zinc-850/60 flex items-center justify-center shrink-0 border border-border/10 overflow-hidden"
                  >
                    <FaviconImage domain={d} className="w-3.5 h-3.5 rounded-full" />
                  </div>
                );
              })}
              {results.length > 6 && (
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 font-mono pl-0.5">
                  +
                </span>
              )}
            </div>
            
            {/* Bottom: Text */}
            <span className="text-[11px] font-semibold text-zinc-650 dark:text-zinc-350 group-hover:text-zinc-800 dark:group-hover:text-zinc-100 transition-colors">
              View {results.length - 3} more
            </span>
          </button>
        )}
      </div>

      {/* Collapsible Container (Grid 2) */}
      <AnimatePresence initial={false}>
        {showAll && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden px-1 pb-1 -mx-1"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
              {results.slice(4).map((src, idx) => {
                let domain = src.url;
                try {
                  domain = new URL(src.url).hostname.replace('www.', '');
                } catch {}

                return (
                  <a
                    key={idx + 4}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col justify-between h-[80px] p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-950/20 hover:bg-white dark:hover:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xs hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-200 no-underline group cursor-pointer"
                  >
                    {/* Title (Top) */}
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
                      {src.title || domain}
                    </h4>

                    {/* Footer (Bottom): Favicon, Domain, Citation Index */}
                    <div className="flex items-center gap-1.5 min-w-0 mt-1.5 select-none">
                      <FaviconImage domain={domain} className="w-3.5 h-3.5 rounded-xs" />
                      <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-medium truncate flex-1">{domain}</span>
                      <span className="text-zinc-300 dark:text-zinc-700/60 font-medium shrink-0">·</span>
                      <span className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0 font-mono">{idx + 5}</span>
                    </div>
                  </a>
                );
              })}

              {/* Collapse Button Card */}
              <button
                onClick={() => setShowAll(false)}
                className="flex flex-col justify-center items-center h-[80px] p-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800/50 bg-zinc-50/10 dark:bg-zinc-950/5 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-zinc-700 hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-3xs"
              >
                <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors rotate-180 mb-1" />
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">
                  Show less
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
WebSearchWidget.displayName = 'WebSearchWidget';

// Helper to extract search tags from content stream
const extractSearchData = (content: string) => {
  let searchLoadingQuery: string | null = null;
  let searchData: { query: string; results: Array<{ title: string; url: string; content: string }> } | null = null;
  let cleanContent = content;

  // Extract search results
  const resultsMatch = content.match(/<search-results>([\s\S]*?)<\/search-results>/);
  if (resultsMatch) {
    try {
      searchData = JSON.parse(resultsMatch[1]);
      cleanContent = cleanContent.replace(/<search-results>[\s\S]*?<\/search-results>/g, '');
    } catch (e) {
      console.warn('Failed to parse search results:', e);
    }
  }

  // Extract search loading query
  const loadingMatch = content.match(/<search-loading query="([\s\S]*?)" \/>/);
  if (loadingMatch) {
    searchLoadingQuery = loadingMatch[1].replace(/&quot;/g, '"');
    cleanContent = cleanContent.replace(/<search-loading query="[\s\S]*?" \/>/g, '');
  }

  return { searchLoadingQuery, searchData, cleanContent: cleanContent.trim() };
};

interface SearchData {
  query: string;
  results: Array<{ title: string; url: string; content: string }>;
}

function areStepsEqual(a: ResearchStep, b: ResearchStep): boolean {
  if (a.type !== b.type) return false;
  if (a.status !== b.status) return false;
  if (a.query !== b.query) return false;
  if (a.url !== b.url) return false;
  if (!a.results && !b.results) return true;
  if (!a.results || !b.results) return false;
  if (a.results.length !== b.results.length) return false;
  for (let i = 0; i < a.results.length; i++) {
    const rA = a.results[i];
    const rB = b.results[i];
    if (rA.url !== rB.url || rA.title !== rB.title || rA.content !== rB.content) {
      return false;
    }
  }
  return true;
}

function areSearchDataEqual(a: SearchData | null, b: SearchData | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.query !== b.query) return false;
  if (a.results.length !== b.results.length) return false;
  for (let i = 0; i < a.results.length; i++) {
    const rA = a.results[i];
    const rB = b.results[i];
    if (rA.url !== rB.url || rA.title !== rB.title || rA.content !== rB.content) {
      return false;
    }
  }
  return true;
}

const MessageComponent = ({
  message,
  index,
  isStreaming,
  expandedThinking,
  setExpandedThinking,
  modelMode,
  onBranchOff
}: MessageProps) => {
  const { showToast } = useCustomToast();
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const [branchedId, setBranchedId] = useState<string | null>(null);
  const [thinkingTime, setThinkingTime] = useState(0);
  const [hasFinishedThinking, setHasFinishedThinking] = useState(false);
  const thinkingTimerRef = useRef<number>();


  const isThinkingModel = !!(modelMode && (
    modelMode.toLowerCase().includes('glm-5.2') || 
    (modelMode.startsWith('gemini') && modelMode.toLowerCase().includes('pro')) || 
    modelMode.toLowerCase().includes('reasoning') ||
    modelMode.toLowerCase().includes('gpt-oss') ||
    (modelMode.toLowerCase().includes('nemotron') && (modelMode.includes('super') || modelMode.includes('ultra')))
  ));

  const processThinkingContent = (content: string) => {
    let thinking = '';
    let mainContent = content;
    let extractedTime = 0;

    let normalizedContent = content;
    const hasThinkEnd = content.includes('</think>');
    const hasThinkStart = content.includes('<think>');
    
    if (hasThinkEnd && !hasThinkStart) {
      normalizedContent = '<think>' + content;
    }

    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    let match;
    const thoughts: string[] = [];
    
    while ((match = thinkRegex.exec(normalizedContent)) !== null) {
      thoughts.push(match[1].trim());
    }

    const lastThinkStart = normalizedContent.lastIndexOf('<think>');
    const lastThinkEnd = normalizedContent.lastIndexOf('</think>');
    
    if (lastThinkStart !== -1 && (lastThinkEnd === -1 || lastThinkEnd < lastThinkStart)) {
      const ongoingThought = normalizedContent.substring(lastThinkStart + 7).trim();
      const searchTagIdx = ongoingThought.search(/<(search-loading|search-results)/);
      if (searchTagIdx !== -1) {
        thoughts.push(ongoingThought.substring(0, searchTagIdx).trim());
        mainContent = normalizedContent.substring(0, lastThinkStart) + ongoingThought.substring(searchTagIdx);
      } else {
        thoughts.push(ongoingThought);
        mainContent = normalizedContent.substring(0, lastThinkStart);
      }
    } else {
      mainContent = normalizedContent;
    }

    mainContent = mainContent.replace(thinkRegex, '').trim();
    thinking = thoughts.join('\n\n').trim();

    const timeMatch = content.match(/<thinkingTime>([\d\.]+)<\/thinkingTime>/);
    if (timeMatch) {
      extractedTime = parseFloat(timeMatch[1]);
      mainContent = mainContent.replace(/<thinkingTime>[\d\.]+<\/thinkingTime>/g, '');
    }

    return { thinking, mainContent, extractedTime };
  };

  const { thinking, mainContent: rawMainContent, extractedTime } = processThinkingContent(message.content);
  const displayThinkingTime = thinkingTime > 0 ? thinkingTime : extractedTime;

  const isThinkingActive = isStreaming && (
    (message.content.includes('<think>') && !message.content.includes('</think>')) ||
    (isThinkingModel && !message.content.includes('</think>') && !rawMainContent.trim())
  );

  // Reset states when message changes
  useEffect(() => {
    if (message.content === '') {
      setThinkingTime(0);
      setHasFinishedThinking(false);
    }
  }, [message.content]);

  // Optimize timer effect to run/stop based on isThinkingActive using requestAnimationFrame
  useEffect(() => {
    if (!isThinkingActive) {
      if (thinkingTimerRef.current !== undefined) {
        cancelAnimationFrame(thinkingTimerRef.current);
        thinkingTimerRef.current = undefined;
      }
      return;
    }

    let lastUpdate = performance.now();
    const updateTimer = (now: number) => {
      if (now - lastUpdate >= 100) {
        setThinkingTime(prev => prev + 0.1);
        lastUpdate = now;
      }
      thinkingTimerRef.current = requestAnimationFrame(updateTimer);
    };

    thinkingTimerRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (thinkingTimerRef.current !== undefined) {
        cancelAnimationFrame(thinkingTimerRef.current);
        thinkingTimerRef.current = undefined;
      }
    };
  }, [isThinkingActive]);

  const handleCopyClick = (text: string) => {
    const blockId = `${index}-${text}`;
    const scrollPos = window.scrollY;
    navigator.clipboard.writeText(text);
    setCopiedBlockId(blockId);
    showToast({
      message: 'Note copied to clipboard',
      type: 'success',
      mode: 'capsule',
    });
    window.scrollTo(0, scrollPos);
    setTimeout(() => setCopiedBlockId(null), 2000);
  };
  
  const prevStepsRef = useRef<ResearchStep[]>([]);
  const prevSearchDataRef = useRef<SearchData | null>(null);

  // Group parsing and reference stabilization in a single useMemo keyed by rawMainContent
  const { steps, searchLoadingQuery, searchData, mainContent, researchTime } = useMemo(() => {
    let mainContent = rawMainContent;
    let researchTime = 0;

    const researchTimeMatch = mainContent.match(/<researchTime>([\d\.]+)<\/researchTime>/);
    if (researchTimeMatch) {
      researchTime = parseFloat(researchTimeMatch[1]);
      mainContent = mainContent.replace(/<researchTime>[\d\.]+<\/researchTime>/g, '');
    }

    const isDeepResearch = mainContent.includes('<research-step');
    let parsedSteps: ResearchStep[] = [];
    let searchLoadingQuery: string | null = null;
    let parsedSearchData: SearchData | null = null;

    if (isDeepResearch) {
      const parsed = parseResearchStream(mainContent);
      parsedSteps = parsed.steps;
      mainContent = parsed.cleanContent;
    } else {
      const parsed = extractSearchData(mainContent);
      searchLoadingQuery = parsed.searchLoadingQuery;
      parsedSearchData = parsed.searchData;
      mainContent = parsed.cleanContent;
    }

    // Stabilize steps array and items referentially
    let stepsChanged = parsedSteps.length !== prevStepsRef.current.length;
    const stabilizedSteps = parsedSteps.map((step, idx) => {
      const prev = prevStepsRef.current[idx];
      if (prev && areStepsEqual(step, prev)) {
        return prev;
      }
      stepsChanged = true;
      return step;
    });
    const finalSteps = stepsChanged ? stabilizedSteps : prevStepsRef.current;
    prevStepsRef.current = finalSteps;

    // Stabilize searchData referentially
    const finalSearchData = areSearchDataEqual(parsedSearchData, prevSearchDataRef.current)
      ? prevSearchDataRef.current
      : parsedSearchData;
    prevSearchDataRef.current = finalSearchData;

    return {
      steps: finalSteps,
      searchLoadingQuery,
      searchData: finalSearchData,
      mainContent,
      researchTime
    };
  }, [rawMainContent]);
  
  // Aggregate all search results across standard search and deep research
  const allSearchResults = useMemo(() => {
    const list: Array<{ title: string; url: string; content: string }> = [];
    if (searchData?.results) {
      list.push(...searchData.results);
    }
    steps.forEach((step) => {
      if (step.results) {
        step.results.forEach((res) => {
          if (!list.some((existing) => existing.url === res.url)) {
            list.push(res);
          }
        });
      }
    });
    return list;
  }, [searchData, steps]);

  const searchMap = useMemo(() => {
    if (allSearchResults.length === 0) return null;
    const map = new Map<string, { title: string; content: string }>();
    for (const item of allSearchResults) {
      if (!item.url) continue;
      const data = { title: item.title || '', content: item.content || '' };
      // Index by full path (exact match)
      map.set(getCleanUrl(item.url), data);
      // Also index by domain only as fallback (catches path mismatches)
      try {
        const domain = new URL(item.url).hostname.replace('www.', '').toLowerCase();
        if (!map.has(domain)) map.set(domain, data);
      } catch {}
    }
    return map;
  }, [allSearchResults]);

  const contextValue = useMemo<MessageContextValue>(() => ({
    searchMap,
    isStreaming,
    messageContent: message.content,
    messageIndex: index,
  }), [searchMap, isStreaming, message.content, index]);

  const processedContent = useMemo(() => {
    const cleanedCitations = cleanMarkdownCitations(mainContent);
    const closedLinks = autoCloseMarkdownLinks(cleanedCitations);
    const latPreprocessed = preprocessLaTeX(closedLinks);
    return linkifyCitations(latPreprocessed, allSearchResults);
  }, [mainContent, allSearchResults]);



  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-12">
        <div className="bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-100 dark:border-cyan-900/30 rounded-2xl rounded-br-none px-3 sm:px-4 py-2 max-w-[90%] sm:max-w-[85%] text-sm space-y-2">
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.images.map((img, imgIndex) => (
                <div key={imgIndex} className="relative w-20 h-20">
                  <img
                    src={img}
                    alt={`Uploaded ${imgIndex + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}
          {message.pdfs && message.pdfs.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.pdfs.map((pdf, pdfIndex) => (
                <div key={pdfIndex} className="flex items-center gap-2 bg-secondary/20 rounded-lg p-3 border border-border/50">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate max-w-[150px]">{pdf.name}</span>
                    <span className="text-xs text-muted-foreground">PDF Document</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className={cn(
      "px-2 sm:px-4 mb-12 text-foreground message-viewport-contain",
      isStreaming && "streaming-message"
    )}>
      {isThinkingActive && (
        <div className="flex items-center gap-2 mb-4">
          <span className="thinking-shine text-sm font-medium">Thinking...</span>
        </div>
      )}
      <div className="relative group w-full">
        {steps.length > 0 && (
          <ResearchTimeline steps={steps} isLoading={isStreaming} researchTime={researchTime} />
        )}

        {searchLoadingQuery && !searchData && isStreaming && (() => {
          let mainStatus = 'Searching web...';
          let subStatus = searchLoadingQuery;

          if (searchLoadingQuery.startsWith('Reading ')) {
            mainStatus = 'Reading page...';
            subStatus = searchLoadingQuery.replace('Reading ', '');
          } else if (searchLoadingQuery.startsWith('Mapping ')) {
            mainStatus = 'Exploring website...';
            subStatus = searchLoadingQuery.replace('Mapping ', '');
          }

          return (
            <div className="mb-5 py-1.5 space-y-1.5 select-none">
              <p className="text-sm font-semibold tracking-wide thinking-shine">
                {mainStatus}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate font-mono max-w-[90%]">
                {subStatus}
              </p>
            </div>
          );
        })()}

        {searchData && (
          <WebSearchWidget searchData={searchData} />
        )}

        <MessageContext.Provider value={contextValue}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 break-words"
            components={markdownComponents}
          >
            {processedContent}
          </ReactMarkdown>
        </MessageContext.Provider>

        {!isStreaming && mainContent && (
          <div className="mt-4 flex justify-start gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            {/* Copy answer button */}
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleCopyClick(mainContent);
                  }}
                  className="relative h-7 w-7 flex items-center justify-center rounded-md bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  <div className="relative w-4 h-4">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className={cn(
                        "absolute inset-0 w-4 h-4 transition-all duration-200",
                        copiedBlockId === `${index}-${mainContent}` ? "opacity-0 scale-75" : "opacity-100 scale-100"
                      )}
                    >
                      <path
                        d="M6 11C6 8.17157 6 6.75736 6.87868 5.87868C7.75736 5 9.17157 5 12 5H15C17.8284 5 19.2426 5 20.1213 5.87868C21 6.75736 21 8.17157 21 11V16C21 18.8284 21 20.2426 20.1213 21.1213C19.2426 22 17.8284 22 15 22H12C9.17157 22 7.75736 22 6.87868 21.1213C6 20.2426 6 18.8284 6 16V11Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M6 19C4.34315 19 3 17.6569 3 16V10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H15C16.6569 2 18 3.34315 18 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className={cn(
                        "absolute inset-0 w-4 h-4 text-green-500 transition-all duration-200",
                        copiedBlockId === `${index}-${mainContent}` ? "opacity-100 scale-100" : "opacity-0 scale-75"
                      )}
                    >
                      <path
                        d="M4.5 12.75L10.5 18.75L19.5 5.25"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="z-50 overflow-hidden rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-xs font-semibold text-cyan-950 select-none animate-in fade-in-0 zoom-in-95"
              >
                {copiedBlockId === `${index}-${mainContent}` ? "Copied!" : "Copy"}
                <TooltipArrow className="fill-cyan-50" />
              </TooltipContent>
            </Tooltip>

            {/* Branch off button */}
            {onBranchOff && (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const branchKey = `branch-${index}`;
                      setBranchedId(branchKey);
                      onBranchOff(index);
                      setTimeout(() => setBranchedId(null), 2000);
                    }}
                    className="relative h-7 w-7 flex items-center justify-center rounded-md bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <div className="relative w-4 h-4">
                      {/* Branch/fork icon */}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className={cn(
                          "absolute inset-0 w-4 h-4 transition-all duration-200",
                          branchedId === `branch-${index}` ? "opacity-0 scale-75" : "opacity-100 scale-100"
                        )}
                      >
                        <path
                          d="M6.02,5.78m0,15.31V4.55m0,0v-1.91m0,3.14v-1.23m0,1.23c0,1.61,1.21,3.11,3.2,3.94l4.58,1.92c1.98,.83,3.2,2.32,3.2,3.94v3.84"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M20.53,17.59l-3.41,3.66-3.66-3.41"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {/* Success check icon */}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className={cn(
                          "absolute inset-0 w-4 h-4 text-cyan-500 transition-all duration-200",
                          branchedId === `branch-${index}` ? "opacity-100 scale-100" : "opacity-0 scale-75"
                        )}
                      >
                        <path
                          d="M4.5 12.75L10.5 18.75L19.5 5.25"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="z-50 overflow-hidden rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-xs font-semibold text-cyan-950 select-none animate-in fade-in-0 zoom-in-95"
                >
                  {branchedId === `branch-${index}` ? "Branched!" : "Branch off"}
                  <TooltipArrow className="fill-cyan-50" />
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const Message = memo(MessageComponent, (prevProps, nextProps) => {
  return (
    prevProps.message.content === nextProps.message.content &&
    prevProps.index === nextProps.index &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.expandedThinking.includes(prevProps.index) === nextProps.expandedThinking.includes(nextProps.index) &&
    prevProps.onBranchOff === nextProps.onBranchOff &&
    (nextProps.isStreaming ? prevProps.modelMode === nextProps.modelMode : true)
  );
}); 