"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Trash2, ExternalLink, Search, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

export default function MyFilesPage() {
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
          <h1 className="text-3xl font-bold text-slate-900">My Files</h1>
          <p className="text-slate-500 mt-1">Manage and view your uploaded datasets.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search files..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 italic text-slate-400 text-sm">
                <th className="px-6 py-4 font-bold">File Name</th>
                <th className="px-6 py-4 font-bold">Size</th>
                <th className="px-6 py-4 font-bold">Uploaded At</th>
                <th className="px-6 py-4 font-bold">Dashboards</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-8 bg-slate-50/20"></td></tr>)
              ) : files.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">No files found. Try uploading one!</td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                           <FileSpreadsheet className="w-5 h-5" />
                         </div>
                         <span className="font-bold text-slate-700">{file.name}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(file.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-wrap gap-2">
                         {file.dashboards.map((d: any) => (
                           <Link key={d.id} href={`/dashboard/${d.id}`} className="px-2 py-1 bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded-lg text-xs font-bold transition-colors">
                             {d.name}
                           </Link>
                         ))}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                         <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Download">
                           <Download className="w-4 h-4" />
                         </button>
                         <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
