"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderHeart, PlayCircle, Globe, Upload, FileText, Loader2, Sparkles, BookOpen } from "lucide-react";
import { useSettingsStore } from "@/lib/store";

type Resource = {
  id: string;
  type: string;
  title: string;
  sourceUrl?: string;
  status: string;
  createdAt: string;
};

export default function ResourcesPage() {
  const { aiApiKey, currentLevel, targetLevel } = useSettingsStore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/resources/upload");
      setResources(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const generateLesson = async (id: string) => {
    if (!aiApiKey) return alert("Missing Gemini API Key");
    setGenerating(id);
    try {
      const res = await fetch("/api/lessons/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiApiKey, resourceId: id, currentLevel, targetLevel })
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Lesson generated successfully! It will now appear in your planner.");
      fetchResources();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white pb-2 flex items-center gap-2">
            <FolderHeart className="w-8 h-8 text-pink-500" /> Resource Library
          </h1>
          <p className="text-slate-400">Import and manage your external learning materials.</p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/resources/upload" className="glass-panel p-6 rounded-2xl hover:border-pink-500/50 transition-all flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white">Upload Document</h3>
            <p className="text-sm text-slate-400 mt-1">Extract text from your files.</p>
          </div>
        </Link>
        <Link href="/resources/youtube" className="glass-panel p-6 rounded-2xl hover:border-red-500/50 transition-all flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white">Find Videos</h3>
            <p className="text-sm text-slate-400 mt-1">Search YouTube for ESL content.</p>
          </div>
        </Link>
        <Link href="/resources/search" className="glass-panel p-6 rounded-2xl hover:border-blue-500/50 transition-all flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white">Web Search</h3>
            <p className="text-sm text-slate-400 mt-1">Find articles and grammar guides.</p>
          </div>
        </Link>
      </div>

      {/* Resource List */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Saved Resources</h2>
        
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-5 h-5 animate-spin"/> Loading...</div>
        ) : resources.length === 0 ? (
          <p className="text-slate-400">Your library is empty. Add some resources above!</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {resources.map(r => (
              <div key={r.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-800 rounded-xl">
                    {r.type === 'document' && <FileText className="w-6 h-6 text-pink-400" />}
                    {r.type === 'youtube' && <PlayCircle className="w-6 h-6 text-red-400" />}
                    {r.type === 'webpage' && <Globe className="w-6 h-6 text-blue-400" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200">{r.title}</h3>
                    <div className="flex gap-2 text-xs text-slate-400 mt-1">
                      <span className="uppercase">{r.type}</span>
                      <span>•</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      {r.status === 'analyzed' && <span className="text-emerald-400 font-bold ml-2">Analyzed</span>}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => generateLesson(r.id)}
                  disabled={generating === r.id || r.status === 'analyzed'}
                  className={`btn-primary whitespace-nowrap ${r.status === 'analyzed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {generating === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {r.status === 'analyzed' ? 'Lesson Generated' : 'Generate Lesson'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
