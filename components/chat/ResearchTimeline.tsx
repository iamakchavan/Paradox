import { useState, useMemo, memo } from 'react';
import { Search, Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ResearchStep } from '@/lib/research/parser';
import { FaviconImage } from './Message';

const DeepResearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12.2429 6.18353L8.55917 8.27415C7.72801 8.74586 7.31243 8.98172 7.20411 9.38603C7.09579 9.79034 7.33779 10.2024 7.82179 11.0264L8.41749 12.0407C8.88853 12.8427 9.12405 13.2437 9.51996 13.3497C9.91586 13.4558 10.3203 13.2263 11.1292 12.7672L14.8646 10.6472M7.05634 9.72257L3.4236 11.7843C2.56736 12.2702 2.13923 12.5132 2.02681 12.9256C1.91438 13.3381 2.16156 13.7589 2.65591 14.6006C3.15026 15.4423 3.39744 15.8631 3.81702 15.9736C4.2366 16.0842 4.66472 15.8412 5.52096 15.3552L9.1537 13.2935M21.3441 5.18488L20.2954 3.39939C19.8011 2.55771 19.5539 2.13687 19.1343 2.02635C18.7147 1.91584 18.2866 2.15881 17.4304 2.64476L13.7467 4.73538C12.9155 5.20709 12.4999 5.44294 12.3916 5.84725C12.2833 6.25157 12.5253 6.6636 13.0093 7.48766L14.1293 9.39465C14.6004 10.1966 14.8359 10.5976 15.2318 10.7037C15.6277 10.8098 16.0322 10.5802 16.841 10.1212L20.5764 8.00122C21.4326 7.51527 21.8608 7.2723 21.9732 6.85985C22.0856 6.44741 21.8384 6.02657 21.3441 5.18488Z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"></path>
    <path d="M12 12.5L16 22" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"></path>
    <path d="M12 12.5L8 22" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"></path>
  </svg>
);

interface ResearchTimelineProps {
  steps: ResearchStep[];
  isLoading: boolean;
  researchTime?: number;
}

interface TimelineStepItemProps {
  step: ResearchStep;
  idx: number;
  totalSteps: number;
  isExpanded: boolean;
  isStepLoading: boolean;
  isLoading: boolean;
  shouldShowLines: boolean;
  toggleStep: (idx: number) => void;
}

const TimelineStepItem = memo(({ step, idx, totalSteps, isExpanded, isStepLoading, isLoading, shouldShowLines, toggleStep }: TimelineStepItemProps) => {
  const isPlan = step.type === 'plan';
  const isSynthesis = step.type === 'synthesis';
  const isSearch = step.type === 'search' || step.type === 'map';
  const isBrowse = step.type === 'browse' || step.type === 'scrape';
  const isX = step.type === 'x';

  // Human-friendly message mapping
  let text = '';
  let subText = '';
  if (isPlan) {
    const isSkipped = step.query === 'skipped';
    text = isStepLoading
      ? 'Formulating research strategy...'
      : isSkipped
        ? 'Research not required'
        : 'Formulated research strategy';
    subText = isSkipped
      ? 'Responded using conversational context'
      : 'Analyzing intent and planning queries';
  } else if (isSynthesis) {
    text = isStepLoading ? 'Synthesizing gathered details into final report...' : 'Synthesized final report';
    subText = 'Structuring report with inline citations';
  } else if (isSearch) {
    if (step.type === 'map') {
      text = isStepLoading ? `Exploring website: ${step.query}...` : `Explored website: ${step.query}`;
    } else {
      text = isStepLoading ? `Finding sources for "${step.query}"...` : `Searched for "${step.query}"`;
    }
    subText = step.query || '';
  } else if (isBrowse) {
    let hostname = '';
    try {
      hostname = step.url ? new URL(step.url).hostname.replace('www.', '') : '';
    } catch {
      try {
        hostname = step.query ? new URL(step.query).hostname.replace('www.', '') : '';
      } catch {
        hostname = step.url || step.query || '';
      }
    }
    if (step.type === 'scrape') {
      text = isStepLoading ? `Reading page: ${hostname}...` : `Read page: ${hostname}`;
    } else {
      text = isStepLoading ? `Reading page: ${hostname}...` : `Read page: ${hostname}`;
    }
    subText = step.url || step.query || '';
  } else if (isX) {
    text = isStepLoading ? `Scanning social discussions for "${step.query}"...` : `Scanned social discussions for "${step.query}"`;
    subText = step.query || '';
  }

  const isCompleted = step.status === 'completed' || (!isLoading && step.status === 'started');
  const hasResults = step.results && step.results.length > 0;
  const isExpandable = isSearch || isBrowse || isX;

  const statusIndicator = (
    <div className="w-5 h-5 flex items-center justify-center shrink-0 z-10 select-none">
      {isStepLoading ? (
        <div className="relative w-4 h-4 flex items-center justify-center">
          {/* Pulsing inner dot */}
          <motion.div
            animate={{ scale: [0.8, 1.2, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-200"
          />
          {/* Spinning dashed perimeter */}
          <svg
            className="w-4 h-4 text-zinc-650 dark:text-zinc-350 animate-spin"
            viewBox="0 0 16 16"
            style={{ animationDuration: '2s' }}
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </svg>
        </div>
      ) : isCompleted ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="w-4 h-4 flex items-center justify-center"
        >
          <svg
            className="w-3.5 h-3.5 text-zinc-650 dark:text-zinc-350"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              d="M4 12L9 17L20 6"
            />
          </svg>
        </motion.div>
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-850" />
      )}
    </div>
  );

  const content = (
    <>
      {/* Left Node Status Circle */}
      {statusIndicator}

      {/* Header Text */}
      <span className={cn(
        "text-xs transition-all duration-200 flex-1 truncate pr-2 font-medium leading-relaxed",
        isStepLoading ? "thinking-shine font-semibold text-foreground" : "text-foreground/80 group-hover:text-primary"
      )}>
        {text}
      </span>

      {/* Collapsed state preview */}
      {!isExpanded && hasResults && (
        <div className="flex -space-x-1 items-center shrink-0 mr-1 select-none">
          {step.results!.slice(0, 3).map((res, rIdx) => {
            let domain = '';
            try {
              domain = new URL(res.url).hostname.replace('www.', '');
            } catch {
              domain = res.url;
            }
            return (
              <div
                key={rIdx}
                className="w-4 h-4 rounded-full border border-background bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0 shadow-3xs"
                style={{ zIndex: 10 - rIdx }}
              >
                <FaviconImage domain={domain} className="w-2.5 h-2.5 rounded-xs shrink-0" />
              </div>
            );
          })}
          {step.results!.length > 3 && (
            <span className="text-[7.5px] font-bold text-muted-foreground/80 bg-muted border border-border/30 rounded-full w-4 h-4 flex items-center justify-center shrink-0 shadow-3xs pl-[0.5px]" style={{ zIndex: 0 }}>
              +{step.results!.length - 3}
            </span>
          )}
        </div>
      )}

      {isExpandable && (
        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200 shrink-0",
          isExpanded && "rotate-180"
        )} />
      )}
    </>
  );

  return (
    <div className="relative flex flex-col gap-1">
      {shouldShowLines && idx < totalSteps - 1 && (
        <div
          className="absolute left-[10px] -translate-x-1/2 top-[28px] bottom-[-2px] w-[1.5px] bg-zinc-200 dark:bg-zinc-800/70 rounded-full select-none pointer-events-none"
          style={{ zIndex: 0 }}
        />
      )}
      {isExpandable ? (
        <button
          type="button"
          onClick={() => toggleStep(idx)}
          className="w-full flex items-center gap-3 text-left py-1.5 hover:bg-secondary/40 dark:hover:bg-zinc-800/10 rounded-lg px-2 -mx-2 transition-all duration-200 cursor-pointer focus:outline-hidden group"
        >
          {content}
        </button>
      ) : (
        <div className="w-full flex items-center gap-3 text-left py-1.5 px-2 -mx-2 select-none">
          {content}
        </div>
      )}

      {/* Step Expanded Content (Accordion Panel) */}
      <AnimatePresence initial={false}>
        {isExpanded && isExpandable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden pl-8 pr-2"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08
                  }
                }
              }}
              className="mt-1 pb-3 pt-1 space-y-3"
            >
              {/* Searching Queries */}
              {(isSearch || isX) && step.query && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 5 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } }
                  }}
                  className="flex flex-col gap-1"
                >
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Searching</span>
                  <div className="flex flex-wrap gap-1.5">
                    <motion.div
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded-full bg-secondary/80 dark:bg-secondary/40 border border-border/50 text-foreground/75 shadow-xs cursor-default select-none"
                    >
                      <Search className="w-3 h-3 shrink-0 text-zinc-400 dark:text-zinc-500" />
                      <span className="truncate max-w-[180px]">{step.query}</span>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Scraped Page URL */}
              {isBrowse && (step.url || step.query) && (() => {
                const targetUrl = step.url || step.query || '';
                if (!targetUrl.startsWith('http')) return null;
                let hostname = '';
                try {
                  hostname = new URL(targetUrl).hostname.replace('www.', '');
                } catch {
                  hostname = targetUrl;
                }

                return (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 5 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } }
                    }}
                    className="flex flex-col gap-1"
                  >
                    <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Reading</span>
                    <div className="flex flex-wrap gap-1.5">
                      <motion.a
                        whileHover={{ scale: 1.03, translateY: -0.5 }}
                        transition={{ type: "spring", stiffness: 450, damping: 15 }}
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded-full bg-secondary/80 dark:bg-secondary/40 hover:bg-secondary border border-border/50 transition-all duration-200 select-none shadow-xs cursor-pointer no-underline align-middle text-foreground/75 hover:text-foreground"
                      >
                        <FaviconImage domain={hostname} className="w-3 h-3 rounded-sm shrink-0" />
                        <span className="truncate max-w-[120px] font-mono">{hostname}</span>
                      </motion.a>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Checked/Read Resources List */}
              {hasResults && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 5 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } }
                  }}
                  className="flex flex-col gap-1"
                >
                  <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Reading</span>
                  <div className="flex flex-wrap gap-1.5">
                    {step.results!.map((res, rIdx) => {
                      let domain = '';
                      try {
                        domain = new URL(res.url).hostname.replace('www.', '');
                      } catch {
                        domain = res.url;
                      }
                      return (
                        <motion.a
                          whileHover={{ scale: 1.03, translateY: -0.5 }}
                          transition={{ type: "spring", stiffness: 450, damping: 15 }}
                          key={rIdx}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={res.title || domain}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded-full bg-secondary/80 dark:bg-secondary/40 hover:bg-secondary border border-border/50 transition-all duration-200 select-none shadow-xs cursor-pointer no-underline align-middle text-foreground/75 hover:text-foreground"
                        >
                          <FaviconImage domain={domain} className="w-3 h-3 rounded-sm shrink-0" />
                          <span className="truncate max-w-[120px]">{domain}</span>
                        </motion.a>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
TimelineStepItem.displayName = 'TimelineStepItem';

const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}sec`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}min${secs}s` : `${mins}min`;
};

export const ResearchTimeline = memo(function ResearchTimeline({ steps, isLoading, researchTime }: ResearchTimelineProps) {
  const [showAllSources, setShowAllSources] = useState(false);
  const [manuallyExpanded, setManuallyExpanded] = useState<Record<number, boolean>>({});
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);

  const isResearchRunning = useMemo(() => {
    if (!isLoading) return false;
    return !steps.some(s => s.type === 'synthesis');
  }, [steps, isLoading]);

  // Count expandable steps
  const expandableStepsCount = useMemo(() => {
    return steps.filter(step => step.type === 'search' || step.type === 'map' || step.type === 'browse' || step.type === 'scrape' || step.type === 'x').length;
  }, [steps]);

  // Compute how many steps are currently expanded
  const expandedCount = useMemo(() => {
    return steps.reduce((acc, step, idx) => {
      const isExpandable = step.type === 'search' || step.type === 'map' || step.type === 'browse' || step.type === 'scrape' || step.type === 'x';
      if (!isExpandable) return acc;
      const isStepExpanded = manuallyExpanded[idx] !== undefined
        ? manuallyExpanded[idx]
        : (isLoading && idx === steps.length - 1);
      return isStepExpanded ? acc + 1 : acc;
    }, 0);
  }, [steps, manuallyExpanded, isLoading]);

  const isAllExpanded = expandableStepsCount > 0 && expandedCount === expandableStepsCount;

  const hasManuallyExpanded = useMemo(() => {
    return Object.values(manuallyExpanded).some(val => val === true);
  }, [manuallyExpanded]);

  const shouldShowLines = useMemo(() => {
    return isLoading || isAllExpanded || hasManuallyExpanded;
  }, [isLoading, isAllExpanded, hasManuallyExpanded]);

  const handleToggleExpandAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setManuallyExpanded(() => {
      const next: Record<number, boolean> = {};
      steps.forEach((step, idx) => {
        const isExpandable = step.type === 'search' || step.type === 'map' || step.type === 'browse' || step.type === 'scrape' || step.type === 'x';
        if (isExpandable) {
          next[idx] = !isAllExpanded;
        }
      });
      return next;
    });
  };

  // Get all unique sources across all steps
  const uniqueSources = useMemo(() => {
    const sourcesMap = new Map<string, { title: string; url: string; domain: string }>();
    steps.forEach((step) => {
      if (step.results) {
        step.results.forEach((res) => {
          if (res.url) {
            try {
              const domain = new URL(res.url).hostname.replace('www.', '');
              sourcesMap.set(res.url, {
                title: res.title || domain,
                url: res.url,
                domain,
              });
            } catch {
              // Ignore invalid URLs
            }
          }
        });
      }
    });
    return Array.from(sourcesMap.values());
  }, [steps]);

  if (steps.length === 0) return null;

  const toggleStep = (idx: number) => {
    setManuallyExpanded((prev) => {
      const isLatestStep = idx === steps.length - 1;
      const defaultState = isLoading && isLatestStep;
      const currentState = prev[idx] !== undefined ? prev[idx] : defaultState;
      return {
        ...prev,
        [idx]: !currentState,
      };
    });
  };

  return (
    <div className="w-full mb-6 rounded-2xl border border-zinc-200/85 dark:border-zinc-800/90 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md p-3.5 shadow-3xs overflow-hidden">
      {/* Stepper Header Title */}
      <button
        type="button"
        onClick={() => setIsTimelineCollapsed(prev => !prev)}
        className="w-full flex items-center justify-between pb-1 text-left cursor-pointer focus:outline-hidden group"
      >
        <div className="flex items-center gap-2">
          {/* Deep Research Logo */}
          <DeepResearchIcon className="w-[18px] h-[18px] text-zinc-650 dark:text-zinc-350 shrink-0" />
          <span className={cn(
            "text-sm font-semibold transition-all duration-300",
            isResearchRunning ? "deep-research-shimmer font-bold" : "text-foreground/90"
          )}>
            Deep Research
          </span>
          {!isLoading && researchTime && researchTime > 0 && (
            <span className="text-xs font-normal text-muted-foreground/80 ml-1.5 select-none">
              ({formatDuration(researchTime)})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <span>{uniqueSources.length} sources</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform duration-250", !isTimelineCollapsed && "rotate-180")} />
        </div>
      </button>

      {/* Stepper Steps List & Sources */}
      <AnimatePresence initial={false}>
        {!isTimelineCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3.5 space-y-4">
              {expandableStepsCount > 0 && (
                <div className="flex items-center justify-between px-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 select-none tracking-wider">
                  <span>{steps.length} {steps.length === 1 ? 'STEP' : 'STEPS'}</span>
                  <button
                    type="button"
                    onClick={handleToggleExpandAll}
                    className="hover:text-foreground cursor-pointer transition-colors duration-150 flex items-center gap-1 select-none pr-1 uppercase tracking-widest text-[9.5px]"
                  >
                    {isAllExpanded ? 'Collapse all' : 'Expand all'}
                  </button>
                </div>
              )}

              <div className="relative flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {steps.map((step, idx) => {
                    const isStepLoading = step.status === 'started' && isLoading;
                    const isLatestStep = idx === steps.length - 1;
                    const isExpanded = manuallyExpanded[idx] !== undefined
                      ? manuallyExpanded[idx]
                      : (isLoading && isLatestStep);

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      >
                        <TimelineStepItem
                          step={step}
                          idx={idx}
                          totalSteps={steps.length}
                          isExpanded={isExpanded}
                          isStepLoading={isStepLoading}
                          isLoading={isLoading}
                          shouldShowLines={shouldShowLines}
                          toggleStep={toggleStep}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unique sources footer block - outside collapsible timeline */}
      {uniqueSources.length > 0 && (
        <div className="pt-3.5 mt-3.5 border-t border-zinc-200/60 dark:border-zinc-800/40">
          <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 select-none tracking-wider uppercase mb-1.5 px-1">
            Sources ({uniqueSources.length})
          </div>

          <div className="px-1 pb-1 -mx-1">
            {/* Grid 1: Always visible top cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
              {(uniqueSources.length > 4 && !showAllSources ? uniqueSources.slice(0, 3) : uniqueSources.slice(0, 4)).map((source, idx) => (
                <motion.a
                  whileHover={{ scale: 1.01, translateY: -0.5 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col justify-between h-[80px] p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-950/20 hover:bg-white dark:hover:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xs transition-all duration-200 no-underline group cursor-pointer"
                >
                  {/* Title (Top) */}
                  <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
                    {source.title || source.domain}
                  </h4>

                  {/* Footer (Bottom): Favicon, Domain, Citation Index */}
                  <div className="flex items-center gap-1.5 min-w-0 mt-1.5 select-none">
                    <FaviconImage domain={source.domain} className="w-3.5 h-3.5 rounded-xs" />
                    <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-medium truncate flex-1">{source.domain}</span>
                    <span className="text-zinc-300 dark:text-zinc-700/60 font-medium shrink-0">·</span>
                    <span className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0 font-mono">{idx + 1}</span>
                  </div>
                </motion.a>
              ))}

              {/* Expand Button Card */}
              {uniqueSources.length > 4 && !showAllSources && (
                <motion.button
                  whileHover={{ scale: 1.01, translateY: -0.5 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  onClick={() => setShowAllSources(true)}
                  className="flex flex-col justify-between h-[80px] p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-100/50 dark:bg-zinc-900/40 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer group shadow-3xs text-left"
                >
                  {/* Top: Favicons row */}
                  <div className="flex items-center gap-1 select-none">
                    {uniqueSources.slice(3, 6).map((r, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full bg-zinc-200/50 dark:bg-zinc-850/60 flex items-center justify-center shrink-0 border border-border/10 overflow-hidden"
                      >
                        <FaviconImage domain={r.domain} className="w-3.5 h-3.5 rounded-full" />
                      </div>
                    ))}
                    {uniqueSources.length > 6 && (
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 font-mono pl-0.5">
                        +
                      </span>
                    )}
                  </div>

                  {/* Bottom: Text */}
                  <span className="text-[11px] font-semibold text-zinc-650 dark:text-zinc-350 group-hover:text-zinc-800 dark:group-hover:text-zinc-100 transition-colors">
                    View {uniqueSources.length - 3} more
                  </span>
                </motion.button>
              )}
            </div>

            {/* Collapsible Container (Grid 2) */}
            <AnimatePresence initial={false}>
              {showAllSources && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden px-1 pb-1 -mx-1"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
                    {uniqueSources.slice(4).map((source, idx) => (
                      <motion.a
                        whileHover={{ scale: 1.01, translateY: -0.5 }}
                        transition={{ type: "spring", stiffness: 450, damping: 15 }}
                        key={idx + 4}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col justify-between h-[80px] p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/40 bg-zinc-50/30 dark:bg-zinc-950/20 hover:bg-white dark:hover:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-2xs transition-all duration-200 no-underline group cursor-pointer"
                      >
                        {/* Title (Top) */}
                        <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 text-[11px] leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
                          {source.title || source.domain}
                        </h4>

                        {/* Footer (Bottom): Favicon, Domain, Citation Index */}
                        <div className="flex items-center gap-1.5 min-w-0 mt-1.5 select-none">
                          <FaviconImage domain={source.domain} className="w-3.5 h-3.5 rounded-xs" />
                          <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500 font-medium truncate flex-1">{source.domain}</span>
                          <span className="text-zinc-300 dark:text-zinc-700/60 font-medium shrink-0">·</span>
                          <span className="text-[9.5px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0 font-mono">{idx + 5}</span>
                        </div>
                      </motion.a>
                    ))}

                    {/* Collapse Button Card */}
                    <motion.button
                      whileHover={{ scale: 1.01, translateY: -0.5 }}
                      transition={{ type: "spring", stiffness: 450, damping: 15 }}
                      onClick={() => setShowAllSources(false)}
                      className="flex flex-col justify-center items-center h-[80px] p-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800/50 bg-zinc-50/10 dark:bg-zinc-950/5 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer group shadow-3xs"
                    >
                      <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors rotate-180 mb-1" />
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">
                        Show less
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
});
ResearchTimeline.displayName = 'ResearchTimeline';
