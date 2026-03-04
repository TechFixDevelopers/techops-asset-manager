import * as XLSX from 'xlsx';

function sanitizeCell(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export interface ExportSheet {
  name: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

export interface ExportConfig {
  filename: string;
  sheets: ExportSheet[];
}

export function exportToExcel({ filename, sheets }: ExportConfig) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const sanitizedRows = sheet.rows.map((row) => row.map(sanitizeCell));
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sanitizedRows]);

    const colWidths = sheet.headers.map((header, i) => {
      const maxLen = Math.max(
        header.length,
        ...sanitizedRows.map((row) => String(row[i] ?? '').length),
      );
      return { wch: Math.min(maxLen + 2, 50) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
