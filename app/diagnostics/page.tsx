"use client";

import { useState, useEffect } from "react";
import { Activity, Server, Database, Globe, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useSettingsStore } from "@/lib/store";

export default function DiagnosticsPage() {
  const { aiApiKey, imageApiKey } = useSettingsStore();
  const [status, setStatus] = useState<{
    db: boolean;
    settingsLoaded: boolean;
    vocabCount: number;
    mistakeCount: number;
    reviewCount: number;
    dailyTaskCount: number;
    completedTaskCount: number;
    pendingAiTaskCount: number;
    resourceCount: number;
    lessonCount: number;
    curriculumCount: number;
    anki: boolean;
    env: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/diagnostics");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white pb-2 flex items-center gap-2">
          <Activity className="w-8 h-8 text-blue-500" /> System Diagnostics
        </h1>
        <p className="text-slate-400">Runtime health check for all core integrations.</p>
      </div>

      {loading || !status ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Running diagnostic checks...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" /> Database Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">SQLite Connection</span>
                {status.db ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Settings Loaded</span>
                {status.settingsLoaded ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Total Tasks</span>
                <span className="font-mono text-white">{status.dailyTaskCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Completed Tasks</span>
                <span className="font-mono text-white">{status.completedTaskCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Pending AI Tasks</span>
                <span className="font-mono text-white">{status.pendingAiTaskCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Vocabulary Items</span>
                <span className="font-mono text-white">{status.vocabCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Mistakes Logged</span>
                <span className="font-mono text-white">{status.mistakeCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Review Queue Items</span>
                <span className="font-mono text-white">{status.reviewCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Total Resources</span>
                <span className="font-mono text-white">{status.resourceCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Generated Lessons</span>
                <span className="font-mono text-white">{status.lessonCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Curriculum Plans</span>
                <span className="font-mono text-white">{status.curriculumCount}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" /> External APIs
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">AnkiConnect (localhost:8765)</span>
                {status.anki ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Gemini AI Key</span>
                {aiApiKey ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <span className="text-sm text-red-400">Missing in Settings</span>}
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Unsplash API Key</span>
                {imageApiKey ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <span className="text-sm text-yellow-400">Missing in Settings</span>}
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl">
                <span className="text-slate-300">Environment Mode</span>
                <span className="font-mono text-white uppercase text-sm">{status.env}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
