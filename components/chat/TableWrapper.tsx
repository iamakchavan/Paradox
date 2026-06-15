import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Download } from 'lucide-react';
import { tableToCSV } from '@/utils/table';
import { processThinkingContent } from '@/utils/chat';

interface TableWrapperProps {
  children: React.ReactNode;
  isLoading: boolean;
  messageContent: string;
  messageIndex: number;
  currentMessageIndex: number;
}

export const TableWrapper = ({ children, isLoading, messageContent, messageIndex, currentMessageIndex }: TableWrapperProps) => {
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
        (messageIndex === currentMessageIndex && isLoading)) {
      return null;
    }
    return (
      <button
        onClick={handleDownload}
        className="download-csv-button"
        title="Download as CSV"
      >
        <Download className="w-4 h-4" />
        <span>Download CSV</span>
      </button>
    );
  }, [tableData, messageContent, messageIndex, currentMessageIndex, isLoading, handleDownload]);

  return (
    <div className="my-6 mx-2 sm:mx-4">
      <div className="table-container">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="min-w-full">
            {children}
          </table>
        </div>
      </div>
      {DownloadButton}
    </div>
  );
}; 