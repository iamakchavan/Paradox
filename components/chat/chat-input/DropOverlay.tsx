import { AttachFileIcon } from './icons';

export function DropOverlay() {
  return (
    <>
      <div className="absolute inset-0 z-20 cursor-copy" />
      <div className="flex flex-col items-center justify-center gap-2.5 z-10 w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="p-2.5 bg-blue-500/10 dark:bg-blue-400/10 rounded-full text-blue-600 dark:text-blue-400">
          <AttachFileIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex flex-col items-center gap-0.5 select-none">
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Drop files here</span>
          <span className="text-xs text-blue-600/70 dark:text-blue-400/70">Images and PDFs supported</span>
        </div>
      </div>
    </>
  );
}

