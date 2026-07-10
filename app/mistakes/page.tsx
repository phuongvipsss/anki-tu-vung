"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

type Mistake = {
  id: string;
  skillType: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  date: string;
};

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMistakes();
  }, []);

  const fetchMistakes = async () => {
    try {
      const res = await fetch("/api/mistakes");
      const data = await res.json();
      setMistakes(data);
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
          <AlertCircle className="w-8 h-8 text-orange-500" /> Mistake Log
        </h1>
        <p className="text-slate-400">Review your past errors to accelerate your learning.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading mistakes...
        </div>
      ) : mistakes.length === 0 ? (
        <div className="glass-panel p-10 rounded-2xl text-center text-slate-400">
          <p className="text-lg">No mistakes logged yet! Keep practicing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {mistakes.map(mistake => (
            <div key={mistake.id} className="glass-panel p-6 rounded-2xl border-l-4 border-l-orange-500 space-y-3">
              <div className="flex justify-between items-start">
                <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-1 rounded capitalize">
                  {mistake.skillType}
                </span>
                <span className="text-slate-500 text-sm">
                  {new Date(mistake.date).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-lg text-white font-medium">{mistake.question.replace("____", "___")}</h3>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-4 text-sm">
                <div className="flex-1 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                  <span className="block text-red-400 font-bold mb-1">You answered:</span>
                  <span className="text-slate-200">{mistake.userAnswer}</span>
                </div>
                <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                  <span className="block text-emerald-400 font-bold mb-1">Correct answer:</span>
                  <span className="text-slate-200">{mistake.correctAnswer}</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-slate-900/50 rounded-xl">
                <span className="block text-blue-400 font-bold mb-1">AI Explanation:</span>
                <p className="text-slate-300 text-sm">{mistake.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
