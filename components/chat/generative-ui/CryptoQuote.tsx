import React from 'react';
import { ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CryptoQuoteProps {
  symbol?: string;
  name?: string;
  price?: string;
  change?: string;
  changePercent?: string;
  isPositive?: string;
  high24h?: string;
  low24h?: string;
  volume24h?: string;
  markPrice?: string;
}

export default function CryptoQuote({
  symbol = 'BTC_USDT',
  name = 'Bitcoin',
  price = '$0.00',
  change = '+$0.00',
  changePercent = '+0.00%',
  isPositive = 'true',
  high24h,
  low24h,
  volume24h,
  markPrice,
}: CryptoQuoteProps) {
  const isUp = isPositive === 'true' || isPositive === 'true' || parseFloat(changePercent) >= 0;
  
  // Format pair name (e.g. BTC_USDT -> BTC / USDT)
  const displaySymbol = symbol.replace('_', ' / ').toUpperCase();
  
  // Clean URL for exchange trade link
  const tradeUrl = `https://crypto.com/exchange/trade/${symbol.toUpperCase()}`;
  const displayUrl = `crypto.com/exchange/trade/${symbol.toUpperCase()}`;

  const hasHigh = high24h && high24h.toLowerCase() !== 'unknown' && high24h.trim() !== '';
  const hasLow = low24h && low24h.toLowerCase() !== 'unknown' && low24h.trim() !== '';
  const hasVolume = volume24h && volume24h.toLowerCase() !== 'unknown' && volume24h.trim() !== '';
  const hasMarkPrice = markPrice && markPrice.toLowerCase() !== 'unknown' && markPrice.trim() !== '';

  return (
    <div className="w-full max-w-[320px] sm:max-w-[350px] bg-zinc-50/20 dark:bg-zinc-950/5 border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl shadow-3xs overflow-hidden select-none text-foreground animate-in fade-in-50 duration-200">
      {/* Top Panel: Core Asset Info & Pricing */}
      <div className="p-4 flex flex-col gap-3 bg-white dark:bg-zinc-950">
        <div className="flex justify-between items-start">
          {/* Left Column: Asset Identifier */}
          <div className="flex flex-col min-w-0">
            <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 font-medium leading-none">
              Crypto.com Market Data
            </span>
            <span className="text-sm font-bold text-foreground mt-1.5 truncate">
              {displaySymbol}
            </span>
            <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 font-medium mt-1 leading-none truncate">
              {name}
            </span>
          </div>

          {/* Right Column: Mini Trend indicator */}
          <div className="flex flex-col items-end shrink-0">
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold font-mono leading-tight",
              isUp ? "text-emerald-500" : "text-rose-500"
            )}>
              {isUp ? <TrendingUp className="w-3.5 h-3.5 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 shrink-0" />}
              <span>{changePercent}</span>
            </span>
          </div>
        </div>

        {/* Hero Price & Absolute Change display */}
        <div className="flex flex-col mt-2.5">
          <span className="text-3xl sm:text-4xl font-extralight tracking-tighter text-foreground font-mono leading-none">
            {price}
          </span>
          <span className={cn(
            "text-[10px] font-semibold mt-2 leading-none",
            isUp ? "text-emerald-650 dark:text-emerald-400" : "text-rose-650 dark:text-rose-450"
          )}>
            {change} Today
          </span>
        </div>

        {/* Sleek Line Divider */}
        {(hasHigh || hasLow || hasVolume || hasMarkPrice) && (
          <div className="h-[1px] bg-zinc-100 dark:bg-zinc-900 w-full my-1.5" />
        )}

        {/* Detailed market metrics block (Key-Value) */}
        <div className="flex flex-col gap-2 min-w-0 text-xs">
          {hasHigh && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-450 dark:text-zinc-500 font-medium">24h High</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-semibold font-mono text-[11px]">{high24h}</span>
            </div>
          )}
          {hasLow && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-450 dark:text-zinc-500 font-medium">24h Low</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-semibold font-mono text-[11px]">{low24h}</span>
            </div>
          )}
          {hasVolume && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-450 dark:text-zinc-500 font-medium">24h Volume</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-semibold font-mono text-[11px]">{volume24h}</span>
            </div>
          )}
          {hasMarkPrice && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-450 dark:text-zinc-500 font-medium">Mark Price</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-semibold font-mono text-[11px]">{markPrice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panel: Dual-line action footer with square CTA button */}
      <div className="px-4 py-3 flex justify-between items-center bg-zinc-50/40 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-900/60">
        <div className="flex flex-col min-w-0 flex-1 mr-2">
          <span className="text-[13px] font-medium text-zinc-850 dark:text-zinc-200 tracking-tight leading-tight truncate">
            Trade on Crypto.com
          </span>
          <span className="text-[10.5px] font-mono text-muted-foreground mt-1 leading-normal truncate">
            {displayUrl}
          </span>
        </div>
        
        <a 
          href={tradeUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 text-zinc-500 dark:text-zinc-450 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
        </a>
      </div>
    </div>
  );
}
