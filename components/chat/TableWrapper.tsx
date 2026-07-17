import { useRef, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { Download, Copy, Check, Table2 } from 'lucide-react';
import { tableToCSV, tableToTSV } from '@/utils/table';
import { processThinkingContent } from '@/utils/chat';

interface TableWrapperProps {
  children: ReactNode;
  isStreaming: boolean;
  messageContent: string;
}

export const TableWrapper = ({ children, isStreaming, messageContent }: TableWrapperProps) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableData, setTableData] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  
  useEffect(() => {
    if (isStreaming || !tableRef.current) {
      setTableData('');
      return;
    }

    const table = tableRef.current;
    setTableData(tableToCSV(table));
  }, [isStreaming, messageContent]);

  const handleDownload = useCallback(() => {
    if (tableData) {
      const blob = new Blob([tableData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'table_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [tableData]);

  const handleCopy = useCallback(async () => {
    if (tableRef.current) {
      try {
        const table = tableRef.current;
        const tsvText = tableToTSV(table);
        const htmlText = table.outerHTML;

        const textBlob = new Blob([tsvText], { type: 'text/plain' });
        const htmlBlob = new Blob([htmlText], { type: 'text/html' });

        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': textBlob,
            'text/html': htmlBlob,
          })
        ]);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy table: ', err);
        try {
          const tsvText = tableToTSV(tableRef.current);
          await navigator.clipboard.writeText(tsvText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackErr) {
          console.error('Clipboard fallback failed: ', fallbackErr);
        }
      }
    }
  }, []);

  const TableActions = useMemo(() => {
    if (!tableData || 
        !processThinkingContent(messageContent).mainContent || 
        isStreaming) {
      return null;
    }
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-7 w-7 cursor-pointer select-none items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-black/[0.055] hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-zinc-100"
          aria-label="Copy table"
          title="Copy table to clipboard"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex h-7 w-7 cursor-pointer select-none items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-black/[0.055] hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 dark:text-zinc-400 dark:hover:bg-white/[0.07] dark:hover:text-zinc-100"
          aria-label="Download table as CSV"
          title="Download as CSV"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }, [tableData, messageContent, isStreaming, handleDownload, handleCopy, copied]);

  return (
    <div data-not-typeset className="table-container my-6">
      <div className="overflow-hidden rounded-[10px] border border-zinc-200/90 bg-white dark:border-white/[0.075] dark:bg-[hsl(var(--surface-panel))]">
        <div className="flex h-11 items-center justify-between border-b border-zinc-200/75 px-3 dark:border-white/[0.06]">
          <div className="flex min-w-0 select-none items-center gap-2">
            <Table2 className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.8} />
            <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">Table</span>
          </div>
          {TableActions}
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table
            ref={tableRef}
            className="w-max min-w-full table-auto border-separate border-spacing-0 text-left text-[13px]"
          >
            {children}
          </table>
        </div>
      </div>
    </div>
  );
};
