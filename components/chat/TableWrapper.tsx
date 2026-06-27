import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Download } from 'lucide-react';
import { tableToCSV } from '@/utils/table';
import { processThinkingContent } from '@/utils/chat';

interface TableWrapperProps {
  children: React.ReactNode;
  isStreaming: boolean;
  messageContent: string;
}

export const TableWrapper = ({ children, isStreaming, messageContent }: TableWrapperProps) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableData, setTableData] = useState<string>('');
  
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

  const DownloadButton = useMemo(() => {
    if (!tableData || 
        !processThinkingContent(messageContent).mainContent || 
        isStreaming) {
      return null;
    }
    return (
      <button
        onClick={handleDownload}
        className="absolute top-2 right-2 opacity-0 group-hover/table:opacity-100 max-md:opacity-100 transition-opacity duration-200 p-1.5 bg-background/90 hover:bg-secondary border border-border/50 rounded-lg shadow-sm text-muted-foreground hover:text-foreground z-10"
        title="Download as CSV"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    );
  }, [tableData, messageContent, isStreaming, handleDownload]);

  return (
    <div className="my-6 mx-1 sm:mx-2 relative group/table table-container">
      <div className="overflow-x-auto custom-scrollbar border-b border-border/20 pb-2">
        <table ref={tableRef} className="min-w-max md:min-w-full w-full text-left border-collapse table-auto">
          {children}
        </table>
      </div>
      {DownloadButton}
    </div>
  );
}; 