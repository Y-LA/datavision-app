import { SheetData } from "./excel-parser";

export interface CleaningChange {
  column: string;
  issue: string;
  fixed: string;
  count: number;
}

export interface CleaningReport {
  changes: CleaningChange[];
  emptyRowsRemoved: number;
  totalChanges: number;
}

const EXCEL_EPOCH = new Date(1899, 11, 30);
const SERIAL_MIN  = 32874; // ~1990-01-01
const SERIAL_MAX  = 73050; // ~2099-12-31

function isSerialDate(v: unknown): boolean {
  if (typeof v !== "number") return false;
  return Number.isInteger(v) && v >= SERIAL_MIN && v <= SERIAL_MAX;
}

function serialToDateStr(n: number): string {
  const d = new Date(EXCEL_EPOCH.getTime() + n * 86_400_000);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function toTitleCase(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\r?\n|\r/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function cleanSheetData(sheet: SheetData): SheetData & { cleaningReport: CleaningReport } {
  // Remove completely empty rows
  const nonEmpty = sheet.rows.filter(row =>
    sheet.headers.some(h => row[h] !== null && row[h] !== undefined && row[h] !== "")
  );
  const emptyRowsRemoved = sheet.rows.length - nonEmpty.length;

  const colChanges = new Map<string, { serialFix: number; textFix: number }>();

  const cleanedRows = nonEmpty.map(row => {
    const newRow = { ...row };
    for (const header of sheet.headers) {
      const v  = newRow[header];
      const cc = colChanges.get(header) ?? { serialFix: 0, textFix: 0 };

      if (isSerialDate(v)) {
        newRow[header] = serialToDateStr(v as number);
        cc.serialFix++;
      } else if (typeof v === "string" && v.trim() !== "") {
        const cleaned = toTitleCase(v);
        if (cleaned !== v) {
          newRow[header] = cleaned;
          cc.textFix++;
        }
      }
      colChanges.set(header, cc);
    }
    return newRow;
  });

  const changes: CleaningChange[] = [];
  for (const [col, cc] of colChanges) {
    if (cc.serialFix > 0) {
      changes.push({ column: col, issue: "Excel serial dates", fixed: "Converted to readable dates", count: cc.serialFix });
    }
    if (cc.textFix > 0) {
      changes.push({ column: col, issue: "Inconsistent casing / extra spaces", fixed: "Normalized to Title Case", count: cc.textFix });
    }
  }

  return {
    ...sheet,
    rows:     cleanedRows,
    rowCount: cleanedRows.length,
    cleaningReport: {
      changes,
      emptyRowsRemoved,
      totalChanges: changes.reduce((a, c) => a + c.count, 0) + emptyRowsRemoved,
    },
  };
}
