export const tableToCSV = (table: HTMLTableElement) => {
  const rows = Array.from(table.querySelectorAll('tr'));
  
  const csv = rows.map(row => {
    const cells = Array.from(row.querySelectorAll('th, td'));
    return cells.map(cell => {
      let text = cell.textContent || '';
      if (text.includes(',') || text.includes('"')) {
        text = `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    }).join(',');
  }).join('\n');
  
  return csv;
};

export const tableToTSV = (table: HTMLTableElement) => {
  const rows = Array.from(table.querySelectorAll('tr'));
  
  const tsv = rows.map(row => {
    const cells = Array.from(row.querySelectorAll('th, td'));
    return cells.map(cell => {
      let text = cell.textContent || '';
      text = text.replace(/\t/g, ' '); // replace internal tabs with spaces
      if (text.includes('"') || text.includes('\n')) {
        text = `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    }).join('\t');
  }).join('\n');
  
  return tsv;
}; 