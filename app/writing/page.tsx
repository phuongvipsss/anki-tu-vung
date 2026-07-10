"use client";

import { useState } from "react";
import { Edit3, Loader2, CheckCircle2, ArrowRight, Zap, Target } from "lucide-react";
import { useSettingsStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

type WritingError = {
  type: string;
  original: string;
  correction: string;
  explanationVi: string;
  severity: string;
  rule: string;
  practiceSuggestion: string;
};

type AnkiCandidate = {
  front: string;
  back: string;
  tag: string;
};

type WritingFeedback = {
  correctedText: string;
  naturalVersion: string;
  overallFeedbackVi: string;
  estimatedLevel: string;
  errors: WritingError[];
  strongPoints: string[];
  weakPoints: string[];
  newVocabularySuggestions: string[];
  rewriteTask: string;
  ankiCandidates: AnkiCandidate[];
};

export default function WritingPage() {
  const { aiApiKey, currentLevel } = useSettingsStore();
  const [writingType, setWritingType] = useState("sentence_practice");
  const [promptText, setPromptText] = useState("");
  const [userText, setUserText] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);

  const WRITING_TYPES = [
    { id: "sentence_practice", label: "Sentence Practice" },
    { id: "paragraph_practice", label: "Paragraph Practice" },
    { id: "email", label: "Email Writing" },
    { id: "workplace", label: "Workplace English" },
    { id: "ielts_task1", label: "IELTS Task 1" },
    { id: "ielts_task2", label: "IELTS Task 2" },
  ];

  const submitWriting = async () => {
    if (!aiApiKey) return alert("Please set Gemini API Key in Settings.");
    if (!userText.trim()) return alert("Please write something to evaluate.");

    setLoading(true);
    setFeedback(null);
    
    try {
      const res = await fetch("/api/writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiApiKey, writingType, promptText: promptText || "Freestyle writing", userText, level: currentLevel })
      });
      const parsed = await res.json();
      if (parsed.error) throw new Error(parsed.error);
      setFeedback(parsed);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-bold text-white pb-2 flex items-center gap-2">
          <Edit3 className="w-8 h-8 text-blue-500" /> Writing Lab
        </h1>
        <p className="text-slate-400">Get instant AI feedback, corrections, and natural phrasing suggestions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Editor Side */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 h-full">
          <div className="flex flex-wrap gap-2">
            {WRITING_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setWritingType(type.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${writingType === type.id ? 'bg-blue-600 text-white font-medium' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {type.label}
              </button>
            ))}
          </div>
          
          <input 
            type="text" 
            placeholder="Prompt or topic (Optional)..." 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
          />

          <textarea
            className="flex-1 min-h-[300px] w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
            placeholder="Start writing here..."
            value={userText}
            onChange={e => setUserText(e.target.value)}
          />

          <button onClick={submitWriting} disabled={loading} className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
            {loading ? "Grading..." : "Submit for Evaluation"}
          </button>
        </div>

        {/* Feedback Side */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center h-full min-h-[500px]">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-300 font-medium text-lg text-center leading-relaxed">
                Analyzing your writing...<br/>
                <span className="text-sm text-slate-400 font-normal">Checking grammar, vocabulary, and flow</span>
              </p>
            </motion.div>
          )}

          {feedback && !loading && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-700">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" /> Overall Feedback
                  </h2>
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                    Est. Level: {feedback.estimatedLevel}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed mb-6">{feedback.overallFeedbackVi}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <h3 className="text-emerald-400 font-bold mb-2">Strengths</h3>
                    <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                      {feedback.strongPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <h3 className="text-red-400 font-bold mb-2">Areas to Improve</h3>
                    <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                      {feedback.weakPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-emerald-400 mb-2">Corrected Version</h3>
                  <p className="text-slate-300 leading-loose bg-slate-900/50 p-4 rounded-xl border border-slate-800">{feedback.correctedText}</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2"><Zap className="w-5 h-5"/> Native/Natural Version</h3>
                  <p className="text-slate-300 leading-loose bg-slate-900/50 p-4 rounded-xl border border-slate-800">{feedback.naturalVersion}</p>
                </div>
              </div>

              {feedback.errors.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-lg font-bold text-white mb-4">Detailed Errors ({feedback.errors.length})</h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {feedback.errors.map((err, i) => (
                      <div key={i} className={`p-4 rounded-xl border-l-4 ${err.severity === 'high' ? 'bg-red-500/10 border-red-500' : err.severity === 'medium' ? 'bg-orange-500/10 border-orange-500' : 'bg-yellow-500/10 border-yellow-500'}`}>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-slate-400 line-through font-medium">{err.original}</span>
                          <ArrowRight className="w-4 h-4 text-slate-500" />
                          <span className="text-emerald-400 font-bold">{err.correction}</span>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{err.explanationVi}</p>
                        <p className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded inline-block">Rule: {err.rule}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
