"use client";

import { useState } from "react";
import { Headphones, PlayCircle, Loader2, Check, X, Search } from "lucide-react";
import { useSettingsStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

type GapFillItem = {
  sentenceWithBlank: string;
  answer: string;
  hintVi: string;
};

type ListeningData = {
  id: string;
  title: string;
  level: string;
  topic: string;
  transcript: string;
  sentences: string[];
  vocabulary: string[];
  gapFillItems: GapFillItem[];
};

export default function ListeningPage() {
  const { aiApiKey, currentLevel } = useSettingsStore();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ListeningData | null>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Gap fill state
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);

  const generate = async () => {
    if (!aiApiKey) return alert("Please set Gemini API Key in Settings.");
    if (!topic) return alert("Please enter a topic.");

    setLoading(true);
    setData(null);
    setChecked(false);
    setUserAnswers({});
    
    try {
      const res = await fetch("/api/listening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiApiKey, topic, level: currentLevel })
      });
      const parsed = await res.json();
      if (parsed.error) throw new Error(parsed.error);
      setData(parsed);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (text: string) => {
    if (!("speechSynthesis" in window)) return alert("Browser does not support TTS");
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Use default browser voice for now
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const checkAnswers = async () => {
    if (!data) return;
    setChecked(true);
    
    let correctCount = 0;
    const mistakes: any[] = [];
    
    data.gapFillItems.forEach((item, i) => {
      const userAns = (userAnswers[i] || "").toLowerCase().trim();
      const correctAns = item.answer.toLowerCase().trim();
      if (userAns === correctAns) {
        correctCount++;
      } else {
        mistakes.push({
          question: item.sentenceWithBlank,
          userAnswer: userAns,
          correctAnswer: correctAns,
          explanation: item.hintVi
        });
      }
    });

    setScore(correctCount);

    // Save attempt
    try {
      await fetch("/api/listening", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: data.id,
          score: correctCount,
          mistakes
        })
      });

      // Also log individual mistakes to MistakeLog for Review queue
      for (const m of mistakes) {
        await fetch("/api/mistakes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skillType: "listening",
            question: m.question,
            userAnswer: m.userAnswer,
            correctAnswer: m.correctAnswer,
            explanation: m.explanation,
            grammarPoint: m.correctAnswer // used as sourceId
          })
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-bold text-white pb-2 flex items-center gap-2">
          <Headphones className="w-8 h-8 text-blue-500" /> Listening Lab
        </h1>
        <p className="text-slate-400">Generate targeted listening exercises via AI.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl flex gap-4">
        <input 
          type="text" 
          placeholder="Enter a topic (e.g. Ordering coffee, A day at work)..." 
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />
        <button onClick={generate} disabled={loading} className="btn-primary px-8 flex items-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Generate
        </button>
      </div>

      <AnimatePresence>
        {data && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Player & Transcript */}
            <div className="space-y-6">
              <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center min-h-[200px]">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">{data.title}</h2>
                <button 
                  onClick={() => playAudio(data.transcript)}
                  className={`p-6 rounded-full transition-all duration-300 ${isPlaying ? 'bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.5)] scale-110' : 'bg-blue-500 hover:bg-blue-400 hover:scale-105'}`}
                >
                  <PlayCircle className="w-16 h-16 text-white" />
                </button>
                <p className="text-slate-400 mt-4 text-sm font-medium">Click to Play/Restart</p>
              </div>

              {checked && (
                <div className="glass-panel p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="font-bold text-white mb-4">Full Transcript</h3>
                  <p className="text-slate-300 leading-relaxed">{data.transcript}</p>
                </div>
              )}
            </div>

            {/* Gap Fill Exercise */}
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Gap Fill Exercise
              </h3>
              
              <div className="space-y-6">
                {data.gapFillItems.map((item, i) => {
                  const parts = item.sentenceWithBlank.split("____");
                  const userAns = (userAnswers[i] || "").toLowerCase().trim();
                  const correctAns = item.answer.toLowerCase().trim();
                  const isCorrect = userAns === correctAns;

                  return (
                    <div key={i} className="bg-slate-900/50 p-4 rounded-xl space-y-3">
                      <p className="text-slate-200 leading-loose">
                        {parts[0]}
                        <input 
                          type="text"
                          disabled={checked}
                          value={userAnswers[i] || ""}
                          onChange={(e) => setUserAnswers(prev => ({...prev, [i]: e.target.value}))}
                          className={`w-32 mx-2 bg-slate-950 border-b-2 px-2 py-1 text-center focus:outline-none ${
                            checked ? (isCorrect ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400') : 'border-slate-600 focus:border-blue-500 text-white'
                          }`}
                        />
                        {parts[1]}
                      </p>
                      {checked && !isCorrect && (
                        <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded-lg">
                          Correct answer: <span className="font-bold">{item.answer}</span>
                          <span className="block text-xs mt-1 opacity-80">{item.hintVi}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!checked ? (
                <button 
                  onClick={checkAnswers} 
                  className="w-full btn-primary py-3 font-bold"
                >
                  Submit Answers
                </button>
              ) : (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center">
                  <p className="text-blue-400 font-bold text-lg">Score: {score} / {data.gapFillItems.length}</p>
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
