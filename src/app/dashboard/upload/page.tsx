"use client";

import { useState } from "react";
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setResult(data);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Upload Dataset</h1>
        <p className="text-slate-500 mt-1">Upload your Excel file to generate instant insights.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        {status === "success" ? (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Successful!</h2>
            <p className="text-slate-500 mb-8">Generated {result.sheets.length} dashboards for <span className="font-bold text-slate-900">"{result.fileName}"</span>.</p>
            
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <Link
                href={`/dashboard/${result.dashboardIds[0]}`}
                className="bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                View Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={() => { setFile(null); setStatus("idle"); }}
                className="text-slate-500 font-bold py-2 hover:text-slate-900 transition-colors"
              >
                Upload another file
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div 
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-colors ${
                file ? "border-blue-300 bg-blue-50/50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UploadIcon className="w-8 h-8" />
                </div>
                {file ? (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-bold text-slate-900 mb-1">Select Excel or CSV file</p>
                    <p className="text-slate-500">or drag and drop it here</p>
                  </>
                )}
              </label>
            </div>

            {status === "error" && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-semibold">Something went wrong. Please try again.</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || status === "uploading"}
              className={`w-full py-4 rounded-2xl font-bold transition-all ${
                !file || status === "uploading"
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95"
              }`}
            >
              {status === "uploading" ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                "Analyze and Generate Dashboard"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
