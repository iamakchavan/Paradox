"use client";

import { memo } from 'react';

export const SearchStatus = memo(({ query }: { query: string }) => {
  let mainStatus = 'Searching web...';
  let subStatus = query;
  if (query.startsWith('Reading ')) {
    mainStatus = 'Reading page...';
    subStatus = query.replace('Reading ', '');
  } else if (query.startsWith('Mapping ')) {
    mainStatus = 'Exploring website...';
    subStatus = query.replace('Mapping ', '');
  } else if (query.startsWith('Executing ')) {
    mainStatus = 'Calling app tool...';
    subStatus = query.replace('Executing ', '');
  }
  return (
    <div className="mb-5 py-1.5 space-y-1.5 select-none">
      <p className="text-sm font-semibold tracking-wide thinking-shine">{mainStatus}</p>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate font-mono max-w-[90%]">{subStatus}</p>
    </div>
  );
});
SearchStatus.displayName = 'SearchStatus';

