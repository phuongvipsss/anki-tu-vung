"use client";

import { useState } from "react";
import { BookA, Search, Loader2, Clock, Check, X, BookmarkPlus } from "lucide-react";
import { useSettingsStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

type VocabularyItem = {
  word: string;
  meaningVi: string;
  example: string;
};

type Question = {
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanationVi: string;
};

type ReadingData = {
  id: string;
  title: string;
  level: string;
  topic: string;
  passage: string;
  estimatedReadingMinutes: number;
  keyVocabulary: VocabularyItem[];
  questions: Question[];
};

export default function ReadingPage() {
  const { aiApiKey, currentLevel } = useSettingsStore();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReadingData | null>(null);

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [savingVocab, setSavingVocab] = useState<string | null>(null);

  const generate = async () => {
    if (!aiApiKey) return alert("Please set Gemini API Key in Settings.");
    if (!topic) return alert("Please enter a topic.");

    setLoading(true);
    setData(null);
    setChecked(false);
    setUserAnswers({});
    
    try {
      const res = await fetch("/api/reading", {
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

  const saveVocab = async (vocab: VocabularyItem) => {
    setSavingVocab(vocab.word);
    try {
      await fetch("/api/db/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: vocab.word,
          meaningVi: vocab.meaningVi,
          examples: JSON.stringify([vocab.example]),
          level: currentLevel,
          partOfSpeech: "unknown"
        })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setSavingVocab(null), 1000);
    }
  };

  const checkAnswers = async () => {
    if (!data) return;
    setChecked(true);
    
    let correctCount = 0;
    const mistakes: any[] = [];
    
    data.questions.forEach((q, i) => {
      const userAns = (userAnswers[i] || "").toLowerCase().trim();
      const correctAns = q.correctAnswer.toLowerCase().trim();
      if (userAns === correctAns) {
        correctCount++;
      } else {
        mistakes.push({
          question: q.question,
          userAnswer: userAns || "No answer",
          correctAnswer: q.correctAnswer,
          explanation: q.explanationVi
        });
      }
    });

    setScore(correctCount);

    // Save attempt
    try {
      await fetch("/api/reading", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passageId: data.id,
          answers: userAnswers,
          score: correctCount,
          mistakes
        })
      });

      // Log mistakes to MistakeLog for Review Queue
      for (const m of mistakes) {
        await fetch("/api/mistakes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skillType: "reading",
            question: m.question,
            userAnswer: m.userAnswer,
            correctAnswer: m.correctAnswer,
            explanation: m.explanation,
            grammarPoint: m.question // Source ID
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
          <BookA className="w-8 h-8 text-blue-500" /> Reading Lab
        </h1>
        <p className="text-slate-400">Deepen comprehension with targeted passages.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl flex gap-4">
        <input 
          type="text" 
          placeholder="Enter a topic (e.g. History of Rome, Climate Change)..." 
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Passage side */}
            <div className="space-y-6 sticky top-6">
              <div className="glass-panel p-8 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white leading-tight">{data.title}</h2>
                  <span className="flex items-center gap-2 text-slate-400 text-sm whitespace-nowrap bg-slate-800 px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4" /> {data.estimatedReadingMinutes} min
                  </span>
                </div>
                <div className="prose prose-invert max-w-none text-slate-300 leading-loose">
                  {data.passage.split('\\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Key Vocab */}
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-4">Key Vocabulary</h3>
                <div className="flex flex-wrap gap-3">
                  {data.keyVocabulary.map((v, i) => (
                    <button 
                      key={i}
                      onClick={() => saveVocab(v)}
                      disabled={savingVocab === v.word}
                      className="text-left bg-slate-900 border border-slate-700 p-3 rounded-xl hover:border-blue-500 transition-all flex items-start gap-3 group"
                    >
                      <div>
                        <p className="font-bold text-blue-400">{v.word}</p>
                        <p className="text-xs text-slate-400">{v.meaningVi}</p>
                      </div>
                      <BookmarkPlus className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${savingVocab === v.word ? 'text-emerald-500 opacity-100' : 'text-blue-500'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Questions Side */}
            <div className="glass-panel p-8 rounded-2xl space-y-8">
              <h3 className="text-2xl font-bold text-white border-b border-slate-700 pb-4">Comprehension</h3>
              
              <div className="space-y-8">
                {data.questions.map((q, i) => {
                  const userAns = userAnswers[i] || "";
                  const correctAns = q.correctAnswer;
                  const isCorrect = userAns.toLowerCase() === correctAns.toLowerCase();

                  return (
                    <div key={i} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded capitalize font-bold">
                          {q.type.replace(/_/g, " ")}
                        </span>
                        <p className="font-medium text-white text-lg">{q.question}</p>
                      </div>
                      
                      <div className="space-y-2 pl-4">
                        {q.options.map((opt) => (
                          <button
                            key={opt}
                            disabled={checked}
                            onClick={() => setUserAnswers(prev => ({...prev, [i]: opt}))}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                              checked && opt.toLowerCase() === correctAns.toLowerCase()
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                                : checked && opt === userAns && opt.toLowerCase() !== correctAns.toLowerCase()
                                ? 'border-red-500 bg-red-500/10 text-red-400'
                                : userAns === opt 
                                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      {checked && (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} className={`p-4 rounded-xl ml-4 ${isCorrect ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                          <div className="flex items-center gap-2 font-bold mb-1">
                            {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            {isCorrect ? "Correct" : "Incorrect"}
                          </div>
                          <p className="text-sm opacity-90">{q.explanationVi}</p>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!checked ? (
                <button 
                  onClick={checkAnswers} 
                  className="w-full btn-primary py-4 text-lg font-bold"
                >
                  Check Answers
                </button>
              ) : (
                <div className="p-6 bg-slate-900/50 border border-slate-700 rounded-xl text-center space-y-2">
                  <p className="text-slate-400 uppercase text-sm font-bold tracking-wider">Final Score</p>
                  <p className="text-4xl font-bold text-white">{score} <span className="text-xl text-slate-500">/ {data.questions.length}</span></p>
                  {score !== data.questions.length && (
                    <p className="text-red-400 text-sm pt-2">Mistakes were sent to your Review Queue.</p>
                  )}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
