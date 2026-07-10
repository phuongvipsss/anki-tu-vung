"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [textPreview, setTextPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    setFile(selected);
    setTitle(selected.name);

    // Simple text extraction for TXT and basic markdown
    const text = await selected.text();
    setTextPreview(text);
  };

  const handleUpload = async () => {
    if (!title || !textPreview) return;
    setUploading(true);

    try {
      const res = await fetch("/api/resources/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          text: textPreview,
          fileType: file?.name.split(".").pop() || "txt"
        })
      });

      if (!res.ok) throw new Error(await res.text());
      
      router.push("/resources");
    } catch (e: any) {
      alert("Upload failed: " + e.message);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white pb-2 flex items-center gap-2">
          <Upload className="w-8 h-8 text-pink-500" /> Upload Document
        </h1>
        <p className="text-slate-400">Import TXT or Markdown files to generate lessons.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border-dashed border-2 border-slate-600 hover:border-pink-500/50 transition-all text-center">
        <input 
          type="file" 
          id="fileInput" 
          className="hidden" 
          accept=".txt,.md,.csv" 
          onChange={handleFileChange} 
        />
        <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
          <FileText className="w-16 h-16 text-slate-500 mb-4" />
          <span className="text-lg font-bold text-white">Click to Select File</span>
          <span className="text-sm text-slate-400 mt-1">Supports .txt, .md (Max 5MB)</span>
        </label>
      </div>

      {textPreview && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300">Document Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-300 flex justify-between">
              Text Extraction Preview
              <span className="text-pink-400">{textPreview.length} characters</span>
            </label>
            <textarea 
              value={textPreview}
              readOnly
              className="w-full h-64 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 focus:outline-none"
            />
          </div>

          <button 
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            {uploading ? "Processing & Chunking..." : "Save to Library"}
          </button>
        </div>
      )}
    </div>
  );
}
