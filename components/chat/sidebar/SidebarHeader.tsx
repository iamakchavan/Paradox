"use client";

import { ChevronsLeft } from 'lucide-react';

export function SidebarHeader({ onCollapse }: { onCollapse?: () => void }) {
  return (
    <div className="h-[56px] px-4 flex items-center justify-between select-none flex-shrink-0 border-b border-foreground/[0.04]">
      <img
        src="/chaticons/logo_chat.png"
        alt="Paradox"
        className="w-7 h-7 object-contain select-none opacity-90"
      />
      {onCollapse && (
        <button
          onClick={onCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground/40 hover:text-foreground/80 hover:bg-foreground/[0.05] active:scale-[0.93] transition-[background-color,color,transform] duration-[var(--motion-duration-fast)] active:duration-75 ease-[var(--motion-ease-out)] cursor-pointer motion-reduce:transform-none"
          title="Collapse sidebar"
        >
          <ChevronsLeft className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
