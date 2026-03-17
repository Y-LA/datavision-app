"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, ArrowRight, BarChart3, Clock } from "lucide-react";

export default function DashboardPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => {
        setFiles(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-1">Manage your datasets and insights.</p>
        </div>
        <Link
          href="/dashboard/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          New Dataset
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-slate-200 shadow-sm animate-pulse">
          <div className="w-12 h-12 bg-slate-100 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-slate-100 rounded"></div>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No datasets yet</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">Upload an Excel file to start generating interactive dashboards and KPIs.</p>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all"
          >
            Upload your first file <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => (
            <div key={file.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(file.createdAt).toLocaleDateString()}
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-1">{file.name}</h3>
              <div className="space-y-3">
                {file.dashboards.map((dash: any) => (
                  <Link
                    key={dash.id}
                    href={`/dashboard/${dash.id}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group hover:bg-blue-600 transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-white">{dash.name}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
