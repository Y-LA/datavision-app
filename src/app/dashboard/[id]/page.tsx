"use client";

import { use, useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, LineChart, Line,
} from "recharts";
import {
  ArrowLeft, FileSpreadsheet, TrendingUp, TrendingDown,
  ArrowUpRight, Activity, Hash, BarChart2, AlertTriangle,
  Info, Sparkles, Star, ChevronDown, Search, Printer,
  CheckCircle2, RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import type { DashboardConfig, KPI, ChartConfig, Insight } from "@/lib/visualization-engine";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

const kpiColorMap: Record<string, string> = {
  total:     "bg-blue-50 text-blue-600",
  average:   "bg-purple-50 text-purple-600",
  max:       "bg-emerald-50 text-emerald-600",
  min:       "bg-orange-50 text-orange-600",
  count:     "bg-slate-100 text-slate-600",
  percent:   "bg-teal-50 text-teal-600",
  growth:    "bg-green-50 text-green-600",
  highlight: "bg-amber-50 text-amber-600",
  info:      "bg-sky-50 text-sky-600",
};

const kpiIconMap: Record<string, React.ElementType> = {
  total:     ArrowUpRight,
  average:   Activity,
  max:       TrendingUp,
  min:       TrendingDown,
  count:     Hash,
  percent:   BarChart2,
  growth:    TrendingUp,
  highlight: Star,
  info:      Info,
};

const insightStyle: Record<string, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
  increase: { bg: "bg-emerald-50", border: "border-emerald-200", icon: TrendingUp,    iconColor: "text-emerald-500" },
  decrease: { bg: "bg-red-50",     border: "border-red-200",     icon: TrendingDown,  iconColor: "text-red-500"     },
  info:     { bg: "bg-sky-50",     border: "border-sky-200",     icon: Info,          iconColor: "text-sky-500"     },
  highlight:{ bg: "bg-amber-50",   border: "border-amber-200",   icon: Sparkles,      iconColor: "text-amber-500"   },
  warning:  { bg: "bg-orange-50",  border: "border-orange-200",  icon: AlertTriangle, iconColor: "text-orange-500"  },
};

function fmtTick(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function ChartRenderer({ chart, isPrinting }: { chart: ChartConfig; isPrinting: boolean }) {
  const w = isPrinting ? 680 : "100%";

  if (chart.type === "pie") {
    const yKey = chart.yKeys[0];
    return (
      <ResponsiveContainer width={w} height={300}>
        <PieChart>
          <Pie
            data={chart.data} dataKey={yKey} nameKey={chart.xKey}
            cx="50%" cy="45%" outerRadius={100} innerRadius={50}
            label={({ percent }) => (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ""}
            labelLine={false}
          >
            {chart.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            formatter={(v: unknown) => [typeof v === "number" ? (v as number).toLocaleString() : String(v ?? ""), yKey] as [string, string]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "area") {
    const yKey = chart.yKeys[0];
    return (
      <ResponsiveContainer width={w} height={300}>
        <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ag0" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey={chart.xKey} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtTick} />
          <Tooltip
            formatter={(v: unknown) => [typeof v === "number" ? (v as number).toLocaleString() : String(v ?? ""), yKey] as [string, string]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          <Area type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2.5} fill="url(#ag0)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "bar") {
    const isMulti = chart.yKeys.length > 1;
    return (
      <ResponsiveContainer width={w} height={300}>
        <BarChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey={chart.xKey} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtTick} />
          <Tooltip
            formatter={(v: unknown, name: unknown) => [(typeof v === "number" ? v.toLocaleString() : String(v ?? "")), String(name ?? "")] as [string, string]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          />
          {isMulti && <Legend />}
          {chart.yKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={50} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  const yKey = chart.yKeys[0];
  return (
    <ResponsiveContainer width={w} height={300}>
      <LineChart data={chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey={chart.xKey} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
        <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

type DashboardData = {
  id: string;
  name: string;
  fileName: string;
  config: DashboardConfig & { cleaningReport?: { changes: { column: string; issue: string; fixed: string; count: number }[]; emptyRowsRemoved: number; totalChanges: number } };
};

export default function DashboardViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [search, setSearch]       = useState("");
  const [filters, setFilters]     = useState<Record<string, string>>({});
  const [showCleaning, setShowCleaning] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/dashboard/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load dashboard"); setLoading(false); });
  };

  useEffect(() => { load(); }, [id]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setIsPrinting(false), 2000);
    }, 350);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error || "Dashboard not found"}</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">← Back</Link>
      </div>
    </div>
  );

  const config         = data.config;
  const cleaningReport = config.cleaningReport;

  const textCols = config.tableHeaders.filter(h => {
    const uniq = new Set(config.tableData.map(r => String(r[h] ?? "")).filter(Boolean));
    return uniq.size >= 2 && uniq.size <= 20;
  });

  const filteredRows = config.tableData.filter(row => {
    if (search) {
      const match = config.tableHeaders.some(h =>
        String(row[h] ?? "").toLowerCase().includes(search.toLowerCase())
      );
      if (!match) return false;
    }
    for (const [col, val] of Object.entries(filters)) {
      if (val && String(row[col] ?? "") !== val) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div id="dashboard-content" className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-2 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Files
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{data.name}</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3" /> {data.fileName}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-colors shadow-sm disabled:opacity-60"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? "Preparing..." : "Export PDF"}
            </button>
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-sm transition-colors shadow-md shadow-blue-600/20"
            >
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* ── Print Title ── */}
        <div className="print-only mb-6 pb-4 border-b-2 border-blue-600">
          <h1 className="text-2xl font-bold text-slate-900">{data.name}</h1>
          <p className="text-slate-500 text-sm mt-1">Source: {data.fileName} · {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {config.kpis.map((kpi: KPI, i) => {
            const Icon   = kpiIconMap[kpi.type] || ArrowUpRight;
            const colors = kpiColorMap[kpi.type] || kpiColorMap.total;
            return (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {kpi.trend && kpi.trend !== "neutral" && (
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${kpi.trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                      {kpi.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {kpi.trendValue}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 truncate">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900 truncate">{kpi.value}</p>
              </div>
            );
          })}
        </div>

        {/* ── Insights ── */}
        {config.insights && config.insights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-slate-800 mb-3">Key Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.insights.map((ins: Insight, i) => {
                const style = insightStyle[ins.type] || insightStyle.info;
                const Icon  = style.icon;
                return (
                  <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${style.bg} ${style.border}`}>
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
                    <p className="text-sm text-slate-700 leading-relaxed">{ins.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Data Cleaning Report ── */}
        {cleaningReport && cleaningReport.totalChanges > 0 && (
          <div className="mb-8 no-print">
            <button
              onClick={() => setShowCleaning(!showCleaning)}
              className="w-full flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-semibold text-sm hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                Data Cleaning: {cleaningReport.totalChanges} issues fixed
                {cleaningReport.emptyRowsRemoved > 0 && `, ${cleaningReport.emptyRowsRemoved} empty rows removed`}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCleaning ? "rotate-180" : ""}`} />
            </button>
            {showCleaning && (
              <div className="mt-2 p-4 bg-white border border-amber-200 rounded-xl">
                {cleaningReport.changes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="font-semibold text-slate-700">{c.column}</span>
                      <span className="text-slate-500 ml-2">— {c.issue}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">{c.fixed}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{c.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Charts ── */}
        {config.charts && config.charts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {config.charts.map((chart: ChartConfig, i) => {
              const fullWidth = chart.type === "area" || (chart.type === "bar" && chart.yKeys.length > 1);
              return (
                <div key={i} className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-w-0 ${fullWidth ? "lg:col-span-2" : ""}`}>
                  <h3 className="font-semibold text-slate-800 mb-1 leading-snug line-clamp-2">{chart.title}</h3>
                  <div className="w-8 h-0.5 bg-blue-600 rounded mb-5" />
                  <ChartRenderer chart={chart} isPrinting={isPrinting} />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Data Table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800">Data Table</h3>
                <p className="text-xs text-slate-400 mt-0.5">{filteredRows.length} of {config.tableData.length} rows</p>
              </div>
              <div className="flex flex-wrap gap-2 no-print">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                  />
                </div>
                {textCols.slice(0, 3).map(col => {
                  const options = Array.from(new Set(config.tableData.map(r => String(r[col] ?? "")).filter(Boolean))).sort();
                  return (
                    <select
                      key={col}
                      value={filters[col] ?? ""}
                      onChange={e => setFilters(f => ({ ...f, [col]: e.target.value }))}
                      className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-[150px]"
                    >
                      <option value="">{col}</option>
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  );
                })}
                {(search || Object.values(filters).some(Boolean)) && (
                  <button
                    onClick={() => { setSearch(""); setFilters({}); }}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {config.tableHeaders.map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRows.slice(0, 100).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {config.tableHeaders.map(h => (
                      <td key={h} className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {row[h] !== null && row[h] !== undefined ? String(row[h]) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">No matching records</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
