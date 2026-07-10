"use client";

import { useState, useEffect } from "react";
import { BookOpen, Calendar, Loader2, Sparkles, Target, Activity } from "lucide-react";
import { useSettingsStore } from "@/lib/store";

export default function CurriculumPage() {
  const { aiApiKey } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<any>(null);

  const generateCurriculum = async () => {
    if (!aiApiKey) {
      setError("Missing Gemini API Key");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/curriculum/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiApiKey })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate curriculum");
      
      setPlan(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white pb-2 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-emerald-500" /> Curriculum Builder
          </h1>
          <p className="text-slate-400">Generate a comprehensive, multi-week study plan based on your library.</p>
        </div>
        <button 
          onClick={generateCurriculum}
          disabled={loading}
          className="btn-primary flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 border-none px-6"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          Generate Plan
        </button>
      </div>

      {error && <div className="text-red-400 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-emerald-500">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : !plan ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-700/50">
          <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-300">No curriculum generated yet</h2>
          <p className="text-slate-500 mt-2">Click generate to build your personalized AI roadmap.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="glass-panel p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-emerald-500/20">
            <h2 className="text-3xl font-bold text-emerald-400 mb-2">{plan.curriculumTitle}</h2>
            <div className="flex gap-4 text-sm text-slate-400 mb-6">
              <span>Target Level: {plan.targetLevel}</span>
              <span>Duration: {plan.durationDays} days</span>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-xl">
              <h3 className="font-bold text-slate-300 flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-emerald-500" /> Main Goal
              </h3>
              <p className="text-slate-300">{plan.mainGoal}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Weekly Milestones</h2>
            {plan.weeklyFocus.map((week: any, i: number) => (
              <div key={i} className="glass-panel p-6 rounded-xl border-l-4 border-l-emerald-500">
                <h3 className="text-xl font-bold text-slate-200">Week {week.week}: {week.focus}</h3>
                <p className="text-slate-400 mt-2">Outcome: {week.expectedOutcome}</p>
              </div>
            ))}
          </div>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Daily Execution</h2>
            {plan.dailyPlan.map((day: any, i: number) => (
              <div key={i} className="glass-panel p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-bold text-emerald-400 flex justify-between">
                  {day.date} 
                  <span className="text-sm font-normal text-slate-400">{day.totalEstimatedMinutes} mins total</span>
                </h3>
                <div className="space-y-3">
                  {day.tasks.map((task: any, j: number) => (
                    <div key={j} className="p-4 bg-slate-900/50 rounded-lg flex items-start gap-4 border border-slate-700/50">
                      <Activity className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-200">{task.title}</h4>
                        <p className="text-sm text-slate-400 mt-1">{task.instructions}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded capitalize">{task.skill}</span>
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">{task.estimatedMinutes}m</span>
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded uppercase">{task.sourceType}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
