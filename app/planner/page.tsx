"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, XCircle, Wand2, Loader2, BookOpen, Headphones, PenTool, Brain, Activity, Clock, Target, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "@/lib/store";

type DailyTask = {
  id: string;
  title: string;
  skill: string;
  estimatedMinutes: number;
  difficulty: string;
  instructions: string;
  expectedUserAction: string;
  successCriteria: string;
  reason: string;
  source: string;
  status: string;
  date: string;
};

export default function PlannerPage() {
  const { aiApiKey } = useSettingsStore();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const ingestStudy4 = async () => {
    setIngesting(true);
    try {
      const res = await fetch("/api/resources/ingest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ingest");
      alert(`Imported ${data.importedResources?.length || 0} resources. Skipped: ${data.skippedFiles?.length || 0}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIngesting(false);
    }
  };

  const generatePlan = async () => {
    if (!aiApiKey) {
      setError("Please set your Gemini API key in Settings.");
      return;
    }
    
    setGenerating(true);
    setError("");

    try {
      const resAI = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiApiKey })
      });
      
      const parsed = await resAI.json();
      if (!resAI.ok) {
        if (parsed.details) {
          throw new Error("AI returned invalid structure: " + JSON.stringify(parsed.details).substring(0, 100));
        }
        throw new Error(parsed.error || "Failed to generate plan");
      }
      
      await fetchTasks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTaskId(prev => prev === id ? null : id);
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'vocabulary': return <BookOpen className="w-5 h-5 text-blue-400" />;
      case 'listening': return <Headphones className="w-5 h-5 text-purple-400" />;
      case 'writing': return <PenTool className="w-5 h-5 text-orange-400" />;
      case 'grammar': return <Target className="w-5 h-5 text-emerald-400" />;
      case 'review': return <Brain className="w-5 h-5 text-pink-400" />;
      default: return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  // Group tasks by date string
  const groupedTasks = tasks.reduce((acc: Record<string, DailyTask[]>, task) => {
    const dateStr = new Date(task.date).toDateString();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(task);
    return acc;
  }, {});

  const dates = Object.keys(groupedTasks).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white pb-2">Mission Briefing</h1>
          <p className="text-slate-400">Your highly personalized, AI-generated tactical study plan.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={ingestStudy4}
            disabled={ingesting}
            className="btn-secondary flex items-center gap-2 bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-2 hover:bg-slate-700"
          >
            {ingesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
            {ingesting ? "Importing Study4..." : "Import Study4"}
          </button>
          
          <button 
            onClick={generatePlan}
            disabled={generating}
            className="btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white border-none px-6 py-2 shadow-lg shadow-blue-500/20"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {generating ? "Computing Plan..." : "Regenerate Plan"}
          </button>
        </div>
      </div>

      {error && <div className="text-red-400 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-blue-500">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : dates.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-700/50">
          <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-300">No active plans found</h2>
          <p className="text-slate-500 mt-2">Generate a new 7-Day Plan to get started.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {dates.map((dateStr) => {
            const dayTasks = groupedTasks[dateStr];
            const isToday = dateStr === new Date().toDateString();
            const completedCount = dayTasks.filter(t => t.status === 'completed').length;
            const totalMinutes = dayTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

            return (
              <div key={dateStr} className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-3">
                    <h2 className={`text-2xl font-bold ${isToday ? 'text-blue-400' : 'text-white'}`}>
                      {isToday ? "Today" : dateStr}
                    </h2>
                    {isToday && <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">Active</span>}
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-2 text-slate-400 font-medium">
                      <Clock className="w-4 h-4" /> {totalMinutes} mins
                    </span>
                    <span className="text-emerald-400 font-medium">
                      {completedCount} / {dayTasks.length} Done
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {dayTasks.map(task => {
                    const isExpanded = expandedTaskId === task.id;
                    const isCompleted = task.status === 'completed';
                    
                    return (
                      <div key={task.id} className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 ${isCompleted ? 'opacity-60 border-slate-800' : 'border-slate-700/50 hover:border-slate-600'}`}>
                        {/* Header */}
                        <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(task.id)}>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, isCompleted ? "pending" : "completed"); }}
                              className="focus:outline-none shrink-0 transition-transform hover:scale-110"
                            >
                              {isCompleted ? <CheckCircle2 className="w-7 h-7 text-emerald-500" /> : <Circle className="w-7 h-7 text-slate-500 hover:text-emerald-400" />}
                            </button>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                {getSkillIcon(task.skill)}
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">{task.skill}</span>
                                {task.source === 'manual' && (
                                  <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Offline / Manual</span>
                                )}
                              </div>
                              <h3 className={`font-bold text-lg ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                                {task.title || task.skill}
                              </h3>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${task.difficulty === 'hard' ? 'bg-red-500/10 text-red-400' : task.difficulty === 'medium' ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              {task.difficulty || 'normal'}
                            </span>
                            <span className="text-slate-400 font-medium text-sm flex items-center gap-1">
                              <Clock className="w-4 h-4" /> {task.estimatedMinutes}m
                            </span>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-700/50 bg-slate-900/30 overflow-hidden"
                            >
                              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-bold text-slate-300 mb-1 uppercase text-xs tracking-wider">Instructions</h4>
                                    <p className="text-slate-400 leading-relaxed">{task.instructions || "No instructions provided."}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-300 mb-1 uppercase text-xs tracking-wider">Expected Action</h4>
                                    <p className="text-slate-400 leading-relaxed">{task.expectedUserAction || "N/A"}</p>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-bold text-slate-300 mb-1 uppercase text-xs tracking-wider">Success Criteria</h4>
                                    <p className="text-slate-400 leading-relaxed">{task.successCriteria || "Complete the module."}</p>
                                  </div>
                                  <div className="flex items-center justify-between pt-4">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, "skipped"); }}
                                      className="text-slate-500 hover:text-red-400 transition-colors flex items-center gap-2 font-medium"
                                    >
                                      <XCircle className="w-4 h-4" /> Skip Task
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
