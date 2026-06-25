import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Search, X } from 'lucide-react';

interface SearchPageContentProps {
  onSelectChat: (chatId: string) => void;
}

export function SearchPageContent({ onSelectChat }: SearchPageContentProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.matchMedia('(hover: none)').matches ? 0 : setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t as number);
  }, []);

  const results = useLiveQuery(
    async () => {
      if (!query.trim()) {
        return db.chats.orderBy('updatedAt').reverse().limit(25).toArray();
      }
      const q = query.toLowerCase();
      return db.chats
        .orderBy('updatedAt')
        .reverse()
        .filter(chat => chat.title.toLowerCase().includes(q))
        .toArray();
    },
    [query]
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    if (date.getFullYear() === now.getFullYear()) {
      return `${day} ${month}`;
    } else {
      return `${day} ${month} ${date.getFullYear()}`;
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-3 flex flex-col h-full">
      {/* Search Input — fixed at top */}
      <div className="relative w-full mb-6 flex-shrink-0">
        <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground/60" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search chats"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-11 pl-11 pr-10 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-full text-sm outline-none focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-700 placeholder:text-muted-foreground/60 text-foreground"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Label — fixed below search */}
      <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider block px-4 mb-3 flex-shrink-0">
        {query.trim() ? 'Search Results' : 'Recent'}
      </span>

      {/* Results — only this section scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 select-none no-scrollbar">
        {results === undefined ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs text-muted-foreground/60">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Searching...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground/60">
            No chats found matching &quot;{query}&quot;
          </div>
        ) : (
          <div className="divide-y divide-zinc-100/10 dark:divide-zinc-900/10">
            {results.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
              >
                <span className="text-[13.5px] text-foreground/80 dark:text-zinc-300 truncate pr-4">
                  {chat.title}
                </span>
                <span className="text-[11.5px] text-muted-foreground/60 flex-shrink-0 font-sans">
                  {formatDate(chat.updatedAt || chat.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
