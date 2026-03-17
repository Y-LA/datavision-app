import * as XLSX from "xlsx";

export interface ExcelData {
  fileName: string;
  sheets: SheetData[];
}

export interface SheetData {
  name: string;
  headers: string[];
  rows: any[];
  rowCount: number;
  columnCount: number;
}

export function parseExcelBuffer(buffer: Buffer, fileName: string): ExcelData {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheets: SheetData[] = workbook.SheetNames.map((name) => {
    const worksheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (data.length === 0) {
      return { name, headers: [], rows: [], rowCount: 0, columnCount: 0 };
    }

    const headers = (data[0] || []).map(String);
    const rows = data.slice(1).map((row) => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    return {
      name,
      headers,
      rows,
      rowCount: rows.length,
      columnCount: headers.length,
    };
  });

  return { fileName, sheets };
}
