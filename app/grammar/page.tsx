"use client";

import { useState } from "react";
import { BookOpen, Check, X, Loader2, PlayCircle } from "lucide-react";
import { useSettingsStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

const TOPICS = [
  "Present Simple", "Present Continuous", "Past Simple", "Present Perfect",
  "Future Forms", "Modal Verbs", "Passive Voice", "Conditionals",
  "Relative Clauses", "Articles", "Prepositions", "Subject-Verb Agreement",
  "Countable and Uncountable Nouns", "Gerund and Infinitive"
];

type Exercise = {
  question: string;
  exerciseType: "multiple_choice" | "fill_blank" | "sentence_correction" | "sentence_transformation";
  options?: string[];
  correctAnswer: string;
  explanationVi: string;
  grammarPoint: string;
};

export default function GrammarPage() {
  const { aiApiKey } = useSettingsStore();
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");

  const generateExercise = async (topic: string) => {
    setSelectedTopic(topic);
    if (!aiApiKey) {
      setError("Please set Gemini API Key in Settings.");
      return;
    }

    setLoading(true);
    setExercise(null);
    setUserAnswer("");
    setChecked(false);
    setError("");

    try {
      const prompt = `
      Act as an expert English Grammar teacher. Create 1 grammar exercise about "${topic}".
      Pick randomly from these types: multiple_choice, fill_blank, sentence_correction, sentence_transformation.
      
      CRITICAL RULES:
      - For ALL exercise types, the "question" field MUST contain the ACTUAL English sentence(s) the user needs to read and solve. Do not just write instructions like "fill in the blanks".
      - If exerciseType is "fill_blank", the "question" MUST contain exactly ONE blank represented by exactly 4 underscores "____". Do not create multiple blanks.
      
      Return ONLY a raw JSON object matching this structure:
      {
        "question": "The full English sentence to be solved...",
        "exerciseType": "multiple_choice", // or fill_blank, sentence_correction, sentence_transformation
        "options": ["A", "B", "C", "D"], // ONLY if multiple_choice
        "correctAnswer": "The exact correct text answer",
        "explanationVi": "Why this is correct (in Vietnamese)",
        "grammarPoint": "${topic}"
      }
      `;

      const resAI = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${aiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      
      const dataAI = await resAI.json();
      let text = dataAI.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!text) throw new Error(`Empty response from AI. Details: ${JSON.stringify(dataAI)}`);

      text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text);
      setExercise(parsed);
    } catch (err: any) {
      setError("Failed to generate exercise. JSON parsing error or API failure. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!exercise || !userAnswer) return;
    setChecked(true);

    const isCorrect = userAnswer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim();

    if (!isCorrect) {
      try {
        await fetch("/api/mistakes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skillType: "grammar",
            question: exercise.question,
            userAnswer,
            correctAnswer: exercise.correctAnswer,
            explanation: exercise.explanationVi,
            grammarPoint: exercise.grammarPoint
          })
        });
      } catch (err) {
        console.error("Failed to log mistake", err);
      }
    }
  };

  return (
    <div className="space-y-8 flex flex-col h-full">
      <div>
        <h1 className="text-3xl font-bold text-white pb-2">Grammar Lab</h1>
        <p className="text-slate-400">Master English grammar with varied AI exercises.</p>
      </div>

      <div className="flex gap-6 flex-1 h-full">
        {/* Topic List */}
        <div className="w-1/3 glass-panel rounded-2xl p-4 overflow-y-auto max-h-[70vh]">
          <h2 className="text-lg font-bold text-white mb-4">Topics</h2>
          <div className="space-y-2">
            {TOPICS.map(topic => (
              <button 
                key={topic}
                onClick={() => generateExercise(topic)}
                className={`w-full text-left p-3 rounded-xl transition-all ${selectedTopic === topic ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Area */}
        <div className="flex-1 glass-panel rounded-2xl p-8 flex flex-col justify-center min-h-[500px]">
          {error && (
            <div className="text-red-400 p-4 bg-red-500/10 border border-red-500/50 rounded-xl mb-4">
              {error}
            </div>
          )}
          
          {!selectedTopic && !loading && (
            <div className="text-center text-slate-400">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a grammar topic from the left to start practicing.</p>
            </div>
          )}

          {loading && (
            <div className="text-center text-slate-400 flex flex-col items-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
              <p>Generating adaptive exercise...</p>
            </div>
          )}

          <AnimatePresence>
            {exercise && !loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto w-full space-y-6">
                <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold capitalize">
                      {exercise.exerciseType.replace("_", " ")}
                    </span>
                  </div>
                  
                  <h3 className="text-xl text-white font-medium mb-6 leading-relaxed">
                    {exercise.exerciseType === "multiple_choice" || exercise.exerciseType === "fill_blank" ? (
                      exercise.question.split("____").map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i !== arr.length - 1 && <span className="inline-block border-b-2 border-slate-500 w-16 mx-2"></span>}
                        </span>
                      ))
                    ) : (
                      <span>{exercise.question}</span>
                    )}
                  </h3>

                  <div className="space-y-3">
                    {exercise.exerciseType === "multiple_choice" && exercise.options ? (
                      exercise.options.map(opt => (
                        <button
                          key={opt}
                          disabled={checked}
                          onClick={() => setUserAnswer(opt)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            checked && opt.toLowerCase() === exercise.correctAnswer.toLowerCase()
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                              : checked && opt === userAnswer && opt.toLowerCase() !== exercise.correctAnswer.toLowerCase()
                              ? 'border-red-500 bg-red-500/10 text-red-400'
                              : userAnswer === opt 
                              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                              : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {opt}
                        </button>
                      ))
                    ) : (
                      <input 
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={checked}
                        className={`w-full bg-slate-950 border-2 rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${
                          checked && userAnswer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim()
                            ? 'border-emerald-500 text-emerald-400'
                            : checked && userAnswer.toLowerCase().trim() !== exercise.correctAnswer.toLowerCase().trim()
                            ? 'border-red-500 text-red-400'
                            : 'border-slate-700 focus:border-blue-500'
                        }`}
                        placeholder="Type your answer here..."
                      />
                    )}
                  </div>
                </div>

                {!checked ? (
                  <button 
                    onClick={handleCheck} 
                    disabled={!userAnswer}
                    className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50"
                  >
                    Check Answer
                  </button>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className={`p-4 rounded-xl ${userAnswer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim() ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                      <div className="flex items-center gap-2 font-bold mb-2">
                        {userAnswer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim() ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        {userAnswer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim() ? "Correct!" : "Incorrect"}
                      </div>
                      
                      {userAnswer.toLowerCase().trim() !== exercise.correctAnswer.toLowerCase().trim() && (
                        <p className="mb-2"><span className="font-semibold">Correct Answer:</span> {exercise.correctAnswer}</p>
                      )}
                      
                      <p className="text-sm opacity-90">{exercise.explanationVi}</p>
                      
                      {userAnswer.toLowerCase().trim() !== exercise.correctAnswer.toLowerCase().trim() && (
                        <p className="text-xs text-red-400 mt-2 font-bold">This mistake was saved to your Mistake Log and scheduled for Review.</p>
                      )}
                    </div>
                    
                    <button onClick={() => generateExercise(selectedTopic)} className="w-full btn-secondary py-4 text-lg font-bold flex items-center justify-center gap-2">
                      <PlayCircle className="w-5 h-5" /> Next Question
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
