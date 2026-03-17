import Link from "next/link";
import { BarChart3, FileSpreadsheet, PieChart } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">DataVision</span>
        </div>
        <div className="flex gap-3 text-sm font-medium">
          <Link href="/login" className="px-5 py-2 text-blue-200 hover:text-white transition-colors">Sign In</Link>
          <Link href="/register" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20">Get Started</Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
          Next Gen Analytics
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-8 tracking-tight">
          Transform Excel into
          <span className="text-blue-400 block sm:inline"> Interactive Dashboards</span>
        </h1>
        <p className="text-xl text-blue-200/80 max-w-2xl mx-auto mb-12 leading-relaxed">
          Upload your Excel files and instantly get beautiful charts, KPIs, and insights. Your data, visualized smartly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-2xl transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-xl">
            Sign In
          </Link>
          <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 bg-slate-800 text-white text-lg font-bold rounded-2xl border border-white/10 transition-all hover:bg-slate-700 hover:scale-105 active:scale-95 shadow-xl">
            Create Account
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            { icon: FileSpreadsheet, title: "Auto-Detect Structure", desc: "Automatically analyzes headers, data types, and relationships in your Excel sheets." },
            { icon: BarChart3, title: "Smart Visualizations", desc: "Generates the right chart type based on your data — line, bar, pie, and more." },
            { icon: PieChart, title: "Instant KPIs", desc: "Key metrics like totals, averages, and trends are calculated automatically." },
          ].map((feature) => (
            <div key={feature.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-blue-200/80">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
