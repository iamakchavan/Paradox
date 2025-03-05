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