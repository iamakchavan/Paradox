import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { tableToCSV, tableToTSV } from '@/utils/table';
import { processThinkingContent } from '@/utils/chat';

interface TableWrapperProps {
  children: React.ReactNode;
  isStreaming: boolean;
  messageContent: string;
}

export const TableWrapper = ({ children, isStreaming, messageContent }: TableWrapperProps) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableData, setTableData] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  
  useEffect(() => {
    if (tableRef.current) {
      const table = tableRef.current;
      const csv = tableToCSV(table);
      setTableData(csv);
    }
  }, []);

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

  const ActionButtons = useMemo(() => {
    if (!tableData || 
        !processThinkingContent(messageContent).mainContent || 
        isStreaming) {
      return null;
    }
    return (
      <div className="absolute top-[5px] right-2 flex items-center gap-1.5 opacity-0 group-hover/table:opacity-100 max-md:opacity-100 transition-opacity duration-200 z-10">
        <button
          onClick={handleCopy}
          className="p-1 bg-background/95 hover:bg-secondary border border-border/50 rounded-lg shadow-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
          title="Copy table to clipboard"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
        <button
          onClick={handleDownload}
          className="p-1 bg-background/95 hover:bg-secondary border border-border/50 rounded-lg shadow-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
          title="Download as CSV"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }, [tableData, messageContent, isStreaming, handleDownload, handleCopy, copied]);

  return (
    <div className="my-6 relative group/table table-container border-y border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-50/5 dark:bg-zinc-950/10">
      <div className="overflow-x-auto custom-scrollbar">
        <table ref={tableRef} className="min-w-max md:min-w-full w-full text-left border-collapse table-auto">
          {children}
        </table>
      </div>
      {ActionButtons}
    </div>
  );
}; 