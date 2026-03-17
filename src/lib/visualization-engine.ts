import { SheetData } from "./excel-parser";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface KPI {
  label: string;
  value: string | number;
  rawValue?: number;
  type: "total" | "average" | "count" | "percent" | "growth" | "max" | "min" | "highlight" | "info";
  column: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  prefix?: string;
  suffix?: string;
}

export interface ChartConfig {
  type: "bar" | "line" | "pie" | "area";
  title: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
}

export interface Insight {
  text: string;
  type: "increase" | "decrease" | "info" | "highlight" | "warning";
  value?: string;
}

export interface DashboardConfig {
  sheetName: string;
  kpis: KPI[];
  charts: ChartConfig[];
  insights: Insight[];
  tableData: Record<string, unknown>[];
  tableHeaders: string[];
}

// ── Financial keyword scoring ──────────────────────────────────────────────────
const REVENUE_KW  = ["gross sales","gross_sales","revenue","net sales","net_sales","sales","turnover","income"];
const PROFIT_KW   = ["net profit","net_profit","profit","earnings","ebit","ebitda","gain"];
const COST_KW     = ["cogs","cost of goods","cost_of_goods","cost of sales","operating cost","expense","cost"];
const QTY_KW      = ["units sold","units_sold","quantity","qty","volume","units"];
const DISCOUNT_KW = ["discount","rebate","deduction","allowance"];
const PRICE_KW    = ["sale price","sale_price","unit price","unit_price","price","rate","fee"];

// Orders domain keywords (Arabic + English)
const ORDER_ID_KW    = ["رقم الطلب","order no","order id","order #","رقم"];
const CUSTOMER_KW    = ["اسم العميل","عميل","customer","client","buyer"];
const CITY_KW        = ["المدينة","مدينة","city","region","area","district"];
const PAYMENT_KW     = ["طريقة الدفع","الدفع","دفع","payment method","payment type","payment"];
const ORDER_TOTAL_KW = ["إجمالي الطلب","إجمالي","اجمالي","order total","total amount","grand total","amount"];
const ORDER_DATE_KW  = ["تاريخ الطلب","تاريخ","order date","created at","created","date"];
const SHIPPING_KW    = ["شركة الشحن","شحن","فرع","shipping","courier","carrier","delivery company"];

const TIME_KW = ["date","month","year","quarter","week","period","time","تاريخ","شهر","سنة","created"];
const CAT_KW  = ["country","region","segment","category","product","type","department","city","branch","channel","مدينة","منتج","قسم"];

function matchesAny(name: string, keywords: string[]): boolean {
  const lower = name.toLowerCase().trim();
  return keywords.some(kw => lower.includes(kw));
}

function financialScore(name: string): number {
  if (matchesAny(name, REVENUE_KW))  return 100;
  if (matchesAny(name, PROFIT_KW))   return 90;
  if (matchesAny(name, COST_KW))     return 80;
  if (matchesAny(name, QTY_KW))      return 70;
  if (matchesAny(name, DISCOUNT_KW)) return 60;
  if (matchesAny(name, PRICE_KW))    return 40;
  return 0;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function numVals(rows: Record<string, unknown>[], col: string): number[] {
  return rows.map(r => Number(r[col])).filter(n => !isNaN(n) && isFinite(n));
}

function fmt(n: number, prefix = ""): string {
  if (Math.abs(n) >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toLocaleString()}`;
}

function trendCalc(vals: number[]): { trend: "up" | "down" | "neutral"; pct: string } {
  if (vals.length < 4) return { trend: "neutral", pct: "0%" };
  const mid = Math.floor(vals.length / 2);
  const firstAvg  = vals.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondAvg = vals.slice(mid).reduce((a, b) => a + b, 0) / (vals.length - mid);
  if (firstAvg === 0) return { trend: "neutral", pct: "0%" };
  const pct = ((secondAvg - firstAvg) / Math.abs(firstAvg)) * 100;
  if (Math.abs(pct) < 2) return { trend: "neutral", pct: "0%" };
  return { trend: pct > 0 ? "up" : "down", pct: `${Math.abs(pct).toFixed(1)}%` };
}

function aggBy(
  rows: Record<string, unknown>[],
  catCol: string,
  numCol: string
): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = String(row[catCol] ?? "Other");
    if (!k || k === "undefined" || k === "null") continue;
    map.set(k, (map.get(k) ?? 0) + (Number(row[numCol]) || 0));
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

function modeValue(rows: Record<string, unknown>[], col: string): string {
  const freq = new Map<string, number>();
  for (const row of rows) {
    const k = String(row[col] ?? "");
    if (k && k !== "undefined") freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  let best = ""; let bestCount = 0;
  for (const [k, v] of freq) {
    if (v > bestCount) { best = k; bestCount = v; }
  }
  return best;
}

function uniqueCount(rows: Record<string, unknown>[], col: string): number {
  return new Set(rows.map(r => String(r[col] ?? "")).filter(Boolean)).size;
}

function getColType(rows: Record<string, unknown>[], col: string): "number" | "date" | "text" {
  const sample = rows.slice(0, 50).map(r => r[col]).filter(v => v !== null && v !== undefined && v !== "");
  if (sample.length === 0) return "text";
  const nums = sample.filter(v => !isNaN(Number(v)) && typeof v !== "boolean");
  if (nums.length / sample.length >= 0.7) return "number";
  const dateRe = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\b/i;
  const dates = sample.filter(v => typeof v === "string" && dateRe.test(String(v)));
  if (dates.length / sample.length >= 0.5) return "date";
  return "text";
}

function getNumCols(sheet: SheetData): string[] {
  return sheet.headers.filter(h => getColType(sheet.rows, h) === "number");
}

function getDateCols(sheet: SheetData): string[] {
  return sheet.headers.filter(h =>
    getColType(sheet.rows, h) === "date" || matchesAny(h, TIME_KW)
  );
}

function getCatCols(sheet: SheetData): string[] {
  return sheet.headers.filter(h => {
    if (getColType(sheet.rows, h) === "number") return false;
    const uniq = uniqueCount(sheet.rows, h);
    return uniq >= 2 && uniq <= 20;
  });
}

function sortedNumCols(sheet: SheetData): string[] {
  return getNumCols(sheet).sort((a, b) => financialScore(b) - financialScore(a));
}

// ── Financial KPIs ─────────────────────────────────────────────────────────────
function generateKPIs(sheet: SheetData): KPI[] {
  const kpis: KPI[] = [];
  const cols = sortedNumCols(sheet);
  if (cols.length === 0) return kpis;

  const revenueCol = cols.find(c => matchesAny(c, REVENUE_KW));
  const profitCol  = cols.find(c => matchesAny(c, PROFIT_KW));
  const costCol    = cols.find(c => matchesAny(c, COST_KW));
  const qtyCol     = cols.find(c => matchesAny(c, QTY_KW));
  const discCol    = cols.find(c => matchesAny(c, DISCOUNT_KW));

  if (revenueCol) {
    const vals = numVals(sheet.rows, revenueCol);
    const sum  = vals.reduce((a, b) => a + b, 0);
    const t    = trendCalc(vals);
    kpis.push({ label: `Total ${revenueCol}`, value: fmt(sum, "$"), rawValue: sum, type: "total", column: revenueCol, trend: t.trend, trendValue: t.pct, prefix: "$" });
  }

  if (profitCol) {
    const vals = numVals(sheet.rows, profitCol);
    const sum  = vals.reduce((a, b) => a + b, 0);
    const t    = trendCalc(vals);
    kpis.push({ label: `Total ${profitCol}`, value: fmt(sum, "$"), rawValue: sum, type: "total", column: profitCol, trend: t.trend, trendValue: t.pct, prefix: "$" });
  }

  if (revenueCol && profitCol) {
    const totalRev  = numVals(sheet.rows, revenueCol).reduce((a, b) => a + b, 0);
    const totalProf = numVals(sheet.rows, profitCol).reduce((a, b) => a + b, 0);
    const margin    = totalRev > 0 ? (totalProf / totalRev) * 100 : 0;
    kpis.push({ label: "Profit Margin %", value: `${margin.toFixed(1)}%`, rawValue: margin, type: "percent", column: profitCol, suffix: "%" });
  }

  if (costCol) {
    const vals = numVals(sheet.rows, costCol);
    const sum  = vals.reduce((a, b) => a + b, 0);
    kpis.push({ label: `Total ${costCol}`, value: fmt(sum, "$"), rawValue: sum, type: "total", column: costCol, prefix: "$" });
  }

  if (discCol) {
    const vals = numVals(sheet.rows, discCol);
    const sum  = vals.reduce((a, b) => a + b, 0);
    kpis.push({ label: `Total ${discCol}`, value: fmt(sum, "$"), rawValue: sum, type: "total", column: discCol, prefix: "$" });
  }

  if (qtyCol) {
    const vals = numVals(sheet.rows, qtyCol);
    const sum  = vals.reduce((a, b) => a + b, 0);
    kpis.push({ label: `Total ${qtyCol}`, value: sum.toLocaleString(), rawValue: sum, type: "count", column: qtyCol });
  }

  if (kpis.length === 0) {
    for (const col of cols.slice(0, 3)) {
      const vals = numVals(sheet.rows, col);
      const sum  = vals.reduce((a, b) => a + b, 0);
      kpis.push({ label: `Total ${col}`, value: fmt(sum), rawValue: sum, type: "total", column: col });
    }
  }

  return kpis.slice(0, 6);
}

// ── Financial Charts ───────────────────────────────────────────────────────────
function generateCharts(sheet: SheetData): ChartConfig[] {
  const charts: ChartConfig[] = [];
  const cols = sortedNumCols(sheet);
  if (cols.length === 0) return charts;

  const revenueCol = cols.find(c => matchesAny(c, REVENUE_KW)) || cols[0];
  const profitCol  = cols.find(c => matchesAny(c, PROFIT_KW));
  const costCol    = cols.find(c => matchesAny(c, COST_KW));
  const dateCols   = getDateCols(sheet);
  const catCols    = getCatCols(sheet);

  // Revenue over Time (Area)
  if (dateCols.length > 0) {
    const dateCol = dateCols[0];
    const grouped = new Map<string, number>();
    for (const row of sheet.rows) {
      const k = String(row[dateCol] ?? "");
      if (!k || k === "undefined") continue;
      grouped.set(k, (grouped.get(k) ?? 0) + (Number(row[revenueCol]) || 0));
    }
    const data = Array.from(grouped.entries()).slice(0, 30)
      .map(([k, v]) => ({ [dateCol]: k, [revenueCol]: v }));
    if (data.length > 1) {
      charts.push({ type: "area", title: `${revenueCol} Over Time`, xKey: dateCol, yKeys: [revenueCol], data });
    }
  }

  // Revenue by Category (Bar)
  if (catCols.length > 0) {
    const catCol = catCols.find(c => matchesAny(c, CAT_KW)) || catCols[0];
    const agg    = aggBy(sheet.rows, catCol, revenueCol);
    if (agg.length > 0) {
      charts.push({
        type: "bar",
        title: `${revenueCol} by ${catCol}`,
        xKey: catCol,
        yKeys: [revenueCol],
        data: agg.slice(0, 10).map(d => ({ [catCol]: d.label, [revenueCol]: d.value })),
      });
    }
  }

  // Revenue vs Profit vs COGS (grouped Bar)
  if (profitCol && costCol && catCols.length > 0) {
    const catCol = catCols.find(c => matchesAny(c, CAT_KW)) || catCols[0];
    const map    = new Map<string, { rev: number; prof: number; cost: number }>();
    for (const row of sheet.rows) {
      const k   = String(row[catCol] ?? "Other");
      if (!k || k === "undefined") continue;
      const cur = map.get(k) ?? { rev: 0, prof: 0, cost: 0 };
      map.set(k, {
        rev:  cur.rev  + (Number(row[revenueCol]) || 0),
        prof: cur.prof + (Number(row[profitCol])  || 0),
        cost: cur.cost + (Number(row[costCol])    || 0),
      });
    }
    const data = Array.from(map.entries()).slice(0, 8)
      .map(([k, v]) => ({ [catCol]: k, [revenueCol]: v.rev, [profitCol]: v.prof, [costCol]: v.cost }));
    if (data.length > 0) {
      charts.push({ type: "bar", title: "Revenue vs Profit vs COGS", xKey: catCol, yKeys: [revenueCol, profitCol, costCol], data });
    }
  }

  // Distribution Pie
  if (catCols.length > 0) {
    const catCol = catCols.find(c => matchesAny(c, CAT_KW)) || catCols[0];
    const agg    = aggBy(sheet.rows, catCol, revenueCol);
    if (agg.length >= 2 && agg.length <= 12) {
      charts.push({
        type: "pie",
        title: `${revenueCol} Distribution by ${catCol}`,
        xKey: catCol,
        yKeys: [revenueCol],
        data: agg.map(d => ({ [catCol]: d.label, [revenueCol]: d.value })),
      });
    }
  }

  return charts;
}

// ── Financial Insights ─────────────────────────────────────────────────────────
function generateInsights(sheet: SheetData): Insight[] {
  const insights: Insight[] = [];
  const cols = sortedNumCols(sheet);
  if (cols.length === 0) return insights;

  const revenueCol = cols.find(c => matchesAny(c, REVENUE_KW));
  const profitCol  = cols.find(c => matchesAny(c, PROFIT_KW));
  const costCol    = cols.find(c => matchesAny(c, COST_KW));
  const catCols    = getCatCols(sheet);

  insights.push({ text: `Dataset contains ${sheet.rowCount.toLocaleString()} records across ${sheet.columnCount} columns.`, type: "info" });

  if (revenueCol && profitCol) {
    const totalRev  = numVals(sheet.rows, revenueCol).reduce((a, b) => a + b, 0);
    const totalProf = numVals(sheet.rows, profitCol).reduce((a, b) => a + b, 0);
    const margin    = totalRev > 0 ? (totalProf / totalRev) * 100 : 0;
    const rating    = margin > 25 ? "excellent" : margin > 15 ? "healthy" : margin > 8 ? "moderate" : "low";
    const iType     = margin > 15 ? "highlight" : margin > 8 ? "info" : "warning";
    insights.push({ text: `Profit margin is ${margin.toFixed(1)}% — ${rating}. Total profit: ${fmt(totalProf, "$")}.`, type: iType, value: `${margin.toFixed(1)}%` });

    if (costCol) {
      const totalCost = numVals(sheet.rows, costCol).reduce((a, b) => a + b, 0);
      const ratio     = totalRev > 0 ? (totalCost / totalRev) * 100 : 0;
      const cType     = ratio > 80 ? "warning" : ratio > 60 ? "info" : "highlight";
      insights.push({ text: `COGS is ${ratio.toFixed(1)}% of revenue — ${ratio > 80 ? "high cost pressure" : ratio > 60 ? "moderate" : "well controlled"}.`, type: cType, value: `${ratio.toFixed(1)}%` });
    }

    const negProfit = sheet.rows.filter(r => (Number(r[profitCol]) || 0) < 0).length;
    if (negProfit > 0) {
      insights.push({ text: `${negProfit} records show negative profit — review pricing strategy.`, type: "warning", value: String(negProfit) });
    }
  }

  if (revenueCol && catCols.length > 0) {
    const catCol = catCols.find(c => matchesAny(c, CAT_KW)) || catCols[0];
    const agg    = aggBy(sheet.rows, catCol, revenueCol);
    if (agg.length > 0) {
      insights.push({ text: `Top performer: "${agg[0].label}" with ${fmt(agg[0].value, "$")} in ${revenueCol}.`, type: "increase", value: fmt(agg[0].value, "$") });
      if (agg.length > 1) {
        insights.push({ text: `Lowest performer: "${agg[agg.length - 1].label}" with ${fmt(agg[agg.length - 1].value, "$")}.`, type: "decrease" });
      }
    }
  }

  if (revenueCol) {
    const vals = numVals(sheet.rows, revenueCol);
    const t    = trendCalc(vals);
    if (t.trend !== "neutral") {
      insights.push({ text: `${revenueCol} ${t.trend === "up" ? "grew" : "declined"} by ${t.pct} comparing first vs second half.`, type: t.trend === "up" ? "increase" : "decrease", value: t.pct });
    }
  }

  return insights.slice(0, 6);
}

// ── Orders Domain ──────────────────────────────────────────────────────────────
function isOrdersSheet(sheet: SheetData): boolean {
  const signals = [
    sheet.headers.some(h => matchesAny(h, ORDER_ID_KW)),
    sheet.headers.some(h => matchesAny(h, CITY_KW)),
    sheet.headers.some(h => matchesAny(h, PAYMENT_KW)),
    sheet.headers.some(h => matchesAny(h, SHIPPING_KW)),
    sheet.headers.some(h => matchesAny(h, ["رقم البوليصة","بوليصة","waybill","awb"])),
    sheet.headers.some(h => matchesAny(h, CUSTOMER_KW)),
  ];
  return signals.filter(Boolean).length >= 3;
}

function generateOrderKPIs(sheet: SheetData): KPI[] {
  const kpis: KPI[] = [];
  kpis.push({ label: "إجمالي الطلبات", value: sheet.rowCount.toLocaleString(), rawValue: sheet.rowCount, type: "count", column: "", trend: "neutral" });

  const totalCol    = sheet.headers.find(h => matchesAny(h, ORDER_TOTAL_KW));
  const customerCol = sheet.headers.find(h => matchesAny(h, CUSTOMER_KW));
  const cityCol     = sheet.headers.find(h => matchesAny(h, CITY_KW));
  const payCol      = sheet.headers.find(h => matchesAny(h, PAYMENT_KW));

  if (totalCol) {
    const vals = numVals(sheet.rows, totalCol);
    const sum  = vals.reduce((a, b) => a + b, 0);
    const avg  = sum / (vals.length || 1);
    const t    = trendCalc(vals);
    kpis.push({ label: "إجمالي الإيرادات", value: fmt(sum), rawValue: sum, type: "total", column: totalCol, trend: t.trend, trendValue: t.pct });
    kpis.push({ label: "متوسط قيمة الطلب", value: fmt(avg), rawValue: avg, type: "average", column: totalCol });
  }

  if (customerCol) {
    const unique = uniqueCount(sheet.rows, customerCol);
    kpis.push({ label: "عدد العملاء", value: unique.toLocaleString(), rawValue: unique, type: "count", column: customerCol });
  }

  if (cityCol) {
    const top = modeValue(sheet.rows, cityCol);
    kpis.push({ label: "أكثر مدينة طلبات", value: top, rawValue: 0, type: "highlight", column: cityCol });
  }

  if (payCol) {
    const top = modeValue(sheet.rows, payCol);
    kpis.push({ label: "طريقة الدفع الأكثر", value: top, rawValue: 0, type: "info", column: payCol });
  }

  return kpis.slice(0, 6);
}

function generateOrderCharts(sheet: SheetData): ChartConfig[] {
  const charts: ChartConfig[] = [];
  const totalCol = sheet.headers.find(h => matchesAny(h, ORDER_TOTAL_KW));
  const cityCol  = sheet.headers.find(h => matchesAny(h, CITY_KW));
  const payCol   = sheet.headers.find(h => matchesAny(h, PAYMENT_KW));
  const dateCol  = sheet.headers.find(h => matchesAny(h, ORDER_DATE_KW));
  const shipCol  = sheet.headers.find(h => matchesAny(h, SHIPPING_KW));

  if (dateCol && totalCol) {
    const grouped = new Map<string, number>();
    for (const row of sheet.rows) {
      const k = String(row[dateCol] ?? "");
      if (!k || k === "undefined") continue;
      grouped.set(k, (grouped.get(k) ?? 0) + (Number(row[totalCol]) || 0));
    }
    const data = Array.from(grouped.entries()).slice(0, 30)
      .map(([k, v]) => ({ [dateCol]: k, [totalCol]: v }));
    if (data.length > 1) charts.push({ type: "area", title: "إجمالي الطلبات عبر الزمن", xKey: dateCol, yKeys: [totalCol], data });
  }

  if (cityCol) {
    const countMap = new Map<string, number>();
    for (const row of sheet.rows) {
      const k = String(row[cityCol] ?? "أخرى");
      countMap.set(k, (countMap.get(k) ?? 0) + 1);
    }
    const data = Array.from(countMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([city, count]) => ({ [cityCol]: city, "عدد الطلبات": count }));
    if (data.length > 0) charts.push({ type: "bar", title: "الطلبات حسب المدينة", xKey: cityCol, yKeys: ["عدد الطلبات"], data });
  }

  if (payCol) {
    const countMap = new Map<string, number>();
    for (const row of sheet.rows) {
      const k = String(row[payCol] ?? "غير محدد");
      countMap.set(k, (countMap.get(k) ?? 0) + 1);
    }
    const data = Array.from(countMap.entries()).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    if (data.length >= 2 && data.length <= 12) {
      charts.push({ type: "pie", title: "توزيع طرق الدفع", xKey: payCol, yKeys: ["عدد الطلبات"], data: data.map(([k, v]) => ({ [payCol]: k, "عدد الطلبات": v })) });
    }
  }

  if (shipCol && totalCol) {
    const agg = aggBy(sheet.rows, shipCol, totalCol);
    if (agg.length > 0) {
      charts.push({ type: "bar", title: "الإيرادات حسب شركة الشحن", xKey: shipCol, yKeys: [totalCol], data: agg.slice(0, 8).map(d => ({ [shipCol]: d.label, [totalCol]: d.value })) });
    }
  }

  return charts;
}

function generateOrderInsights(sheet: SheetData): Insight[] {
  const insights: Insight[] = [];
  const totalCol = sheet.headers.find(h => matchesAny(h, ORDER_TOTAL_KW));
  const cityCol  = sheet.headers.find(h => matchesAny(h, CITY_KW));
  const payCol   = sheet.headers.find(h => matchesAny(h, PAYMENT_KW));
  const shipCol  = sheet.headers.find(h => matchesAny(h, SHIPPING_KW));

  insights.push({ text: `إجمالي ${sheet.rowCount.toLocaleString()} طلب في قاعدة البيانات.`, type: "info" });

  if (totalCol) {
    const vals = numVals(sheet.rows, totalCol);
    const sum  = vals.reduce((a, b) => a + b, 0);
    const avg  = sum / (vals.length || 1);
    insights.push({ text: `متوسط قيمة الطلب ${fmt(avg)} — إجمالي الإيرادات ${fmt(sum)}.`, type: "highlight", value: fmt(avg) });
    const t = trendCalc(vals);
    if (t.trend !== "neutral") {
      insights.push({ text: `قيم الطلبات ${t.trend === "up" ? "ارتفعت" : "انخفضت"} بنسبة ${t.pct} مقارنةً بالنصف الأول.`, type: t.trend === "up" ? "increase" : "decrease", value: t.pct });
    }
  }

  if (cityCol) {
    const countMap = new Map<string, number>();
    for (const row of sheet.rows) {
      const k = String(row[cityCol] ?? "");
      if (k) countMap.set(k, (countMap.get(k) ?? 0) + 1);
    }
    const top = Array.from(countMap.entries()).sort((a, b) => b[1] - a[1])[0];
    if (top) insights.push({ text: `المدينة الأعلى طلبات: "${top[0]}" بـ ${top[1].toLocaleString()} طلب.`, type: "highlight", value: String(top[1]) });
  }

  if (payCol) {
    const top      = modeValue(sheet.rows, payCol);
    const topCount = sheet.rows.filter(r => String(r[payCol]) === top).length;
    const pct      = ((topCount / sheet.rowCount) * 100).toFixed(0);
    insights.push({ text: `"${top}" هي طريقة الدفع المفضلة بنسبة ${pct}% من الطلبات.`, type: "info", value: pct + "%" });
  }

  if (shipCol) {
    const top = modeValue(sheet.rows, shipCol);
    insights.push({ text: `شركة الشحن الأكثر استخداماً: "${top}".`, type: "info" });
  }

  return insights.slice(0, 6);
}

// ── Main export ────────────────────────────────────────────────────────────────
export function generateDashboard(sheet: SheetData): DashboardConfig {
  const orders = isOrdersSheet(sheet);
  return {
    sheetName:    sheet.name,
    kpis:         orders ? generateOrderKPIs(sheet)     : generateKPIs(sheet),
    charts:       orders ? generateOrderCharts(sheet)   : generateCharts(sheet),
    insights:     orders ? generateOrderInsights(sheet) : generateInsights(sheet),
    tableData:    sheet.rows.slice(0, 200) as Record<string, unknown>[],
    tableHeaders: sheet.headers,
  };
}
