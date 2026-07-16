"use client";

import Image from 'next/image';
import { ChevronsLeft } from 'lucide-react';

export function SidebarHeader({ onCollapse }: { onCollapse?: () => void }) {
  return (
    <div className="flex h-[60px] flex-shrink-0 select-none items-center justify-between px-3.5">
      <Image
        src="/chaticons/logo_chat.png"
        alt="Paradox"
        width={30}
        height={30}
        priority
        draggable={false}
        className="h-[30px] w-[30px] select-none object-contain opacity-95"
      />
      {onCollapse && (
        <button
          onClick={onCollapse}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-foreground/38 outline-none transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-out)] hover:bg-foreground/[0.045] hover:text-foreground/75 focus-visible:ring-2 focus-visible:ring-foreground/15 active:scale-[0.93] active:duration-75 motion-reduce:transform-none"
          title="Collapse sidebar"
        >
          <ChevronsLeft className="h-[17px] w-[17px]" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
