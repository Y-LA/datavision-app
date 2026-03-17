"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { BarChart3, FileSpreadsheet, PieChart } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

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
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-white text-slate-900 text-lg font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
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
