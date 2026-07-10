"use client";

import { useState } from "react";
import { Search, Volume2, Sparkles, Image as ImageIcon, Plus, CheckCircle, Loader2, Database } from "lucide-react";
import { useSettingsStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import type { DictionaryResult } from "@/lib/dictionary";
import type { AIGeneratedContent } from "@/lib/ai";

export default function VocabularyPage() {
  const { aiApiKey, imageApiKey, deckName, modelName } = useSettingsStore();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dictResult, setDictResult] = useState<DictionaryResult | null>(null);
  const [aiContent, setAiContent] = useState<AIGeneratedContent | null>(null);
  const [images, setImages] = useState<string[]>([]);
  
  const [selectedExample, setSelectedExample] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<string>("");
  
  const [ankiLoading, setAnkiLoading] = useState(false);
  const [ankiSuccess, setAnkiSuccess] = useState(false);
  const [ankiError, setAnkiError] = useState("");

  const [dbLoading, setDbLoading] = useState(false);
  const [dbSuccess, setDbSuccess] = useState(false);

  const playAudio = (url: string) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.play();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError("");
    setDictResult(null);
    setAiContent(null);
    setImages([]);
    setAnkiSuccess(false);
    setAnkiError("");
    setDbSuccess(false);
    
    try {
      const res = await fetch(`/api/lookup?word=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDictResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAI = async () => {
    if (!dictResult) return;
    if (!aiApiKey) {
      setError("Please set Google Gemini API Key in Settings first.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: dictResult.word,
          meaningVi: dictResult.meaningVi || "Translate to Vietnamese based on context",
          apiKey: aiApiKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiContent(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    if (!dictResult) return;
    if (!imageApiKey) {
      setError("Please set Unsplash API Key in Settings first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: dictResult.word, apiKey: imageApiKey })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages(data.images);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveToDB = async () => {
    if (!dictResult) return;
    setDbLoading(true);
    try {
      const res = await fetch("/api/db/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: dictResult.word,
          ipa: dictResult.ipa,
          partOfSpeech: dictResult.partOfSpeech,
          definitionEn: dictResult.definitionEn,
          meaningVi: dictResult.meaningVi || aiContent?.examples[selectedExample]?.vi || "",
          examples: JSON.stringify(aiContent?.examples || []),
          synonyms: aiContent?.synonyms?.join(", ") || "",
          collocations: aiContent?.collocations?.join(", ") || "",
          level: aiContent?.examples[selectedExample]?.level || "Unknown"
        })
      });
      if (!res.ok) throw new Error("Failed to save to DB");
      setDbSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDbLoading(false);
    }
  };

  const addToAnki = async () => {
    if (!dictResult || !aiContent) return;
    setAnkiLoading(true);
    setAnkiError("");
    setAnkiSuccess(false);

    const example = aiContent.examples[selectedExample];

    try {
      const res = await fetch("/api/anki/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: dictResult.word,
          ipa: dictResult.ipa,
          meaningVi: dictResult.meaningVi || example.vi,
          definitionEn: dictResult.definitionEn,
          exampleEn: example.en,
          exampleVi: example.vi,
          audioUrl: dictResult.audioUrl,
          imageUrl: selectedImage,
          deckName,
          modelName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnkiSuccess(true);
    } catch (err: any) {
      setAnkiError(err.message);
    } finally {
      setAnkiLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Search Section */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 pb-2">
          Vocabulary Search
        </h1>
        <p className="text-slate-400">Discover words, understand nuances, and learn natively.</p>
        
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mt-8">
          <input 
            type="text" 
            className="w-full bg-slate-900/80 border border-slate-700/50 rounded-2xl px-6 py-4 pl-14 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xl backdrop-blur-sm transition-all"
            placeholder="Type an English word..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="absolute left-5 top-4 w-6 h-6 text-slate-500" />
          <button type="submit" disabled={loading} className="absolute right-3 top-3 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-colors">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </form>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center">
          {error}
        </motion.div>
      )}

      {/* Dictionary Result */}
      <AnimatePresence>
        {dictResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-white capitalize">{dictResult.word}</h2>
                <div className="flex items-center gap-3 mt-2 text-slate-300">
                  <span className="px-2 py-1 bg-slate-800 rounded-md text-sm font-medium">{dictResult.partOfSpeech}</span>
                  {dictResult.ipa && <span className="font-mono text-blue-300">/{dictResult.ipa}/</span>}
                  {dictResult.audioUrl && (
                    <button onClick={() => playAudio(dictResult.audioUrl)} className="text-blue-400 hover:text-blue-300 transition-colors">
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <h3 className="text-xl font-bold text-blue-400 mb-2">{dictResult.meaningVi}</h3>
              <p className="text-slate-200"><span className="text-slate-500 font-semibold mr-2">Definition:</span>{dictResult.definitionEn}</p>
              {dictResult.exampleEn && <p className="text-slate-300 mt-2 italic">"{dictResult.exampleEn}"</p>}
            </div>

            {/* Actions for AI & Images */}
            <div className="flex gap-4">
              {!aiContent && (
                <button onClick={generateAI} disabled={loading} className="btn-primary flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 border-none">
                  <Sparkles className="w-5 h-5" /> Generate AI Context
                </button>
              )}
              {!images.length && (
                <button onClick={fetchImages} disabled={loading} className="btn-secondary flex-1 flex justify-center items-center gap-2">
                  <ImageIcon className="w-5 h-5" /> Fetch Images
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Selection */}
      {images.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-300">Select an Image</h3>
          <div className="grid grid-cols-5 gap-4">
            {images.map((img, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedImage(img === selectedImage ? "" : img)}
                className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${img === selectedImage ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/30' : 'border-transparent hover:border-slate-500'}`}
              >
                <img src={img} alt="suggestion" className="w-full h-24 object-cover" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Content */}
      <AnimatePresence>
        {aiContent && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              
              {/* Extended Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm text-slate-400 font-semibold mb-1">Synonyms</h4>
                  <p className="text-slate-200">{aiContent.synonyms.join(", ") || "None"}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm text-slate-400 font-semibold mb-1">Antonyms</h4>
                  <p className="text-slate-200">{aiContent.antonyms.join(", ") || "None"}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm text-slate-400 font-semibold mb-1">Collocations</h4>
                  <p className="text-slate-200">{aiContent.collocations.join(", ") || "None"}</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm text-slate-400 font-semibold mb-1">Word Family</h4>
                  <p className="text-slate-200">{aiContent.wordFamily.join(", ") || "None"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" /> Select Context (Level)
                </h3>
                <div className="space-y-3">
                  {aiContent.examples.map((ex, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedExample(idx)}
                      className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedExample === idx ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-500'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${ex.level === 'A1' ? 'bg-green-500/20 text-green-400' : ex.level === 'B1' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                          {ex.level}
                        </span>
                      </div>
                      <p className="text-white font-medium mb-1">{ex.en}</p>
                      <p className="text-slate-400 text-sm">{ex.vi}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <p className="text-orange-300 text-sm font-medium">Common Mistakes:</p>
                <p className="text-orange-200/80 text-sm mt-1">{aiContent.mistakes}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={saveToDB} 
                disabled={dbLoading || dbSuccess} 
                className={`flex-1 py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-lg ${dbSuccess ? 'bg-slate-700 text-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
              >
                {dbLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : dbSuccess ? <CheckCircle className="w-6 h-6" /> : <Database className="w-6 h-6" />}
                {dbSuccess ? "Saved to DB!" : "Save to DB"}
              </button>

              <button 
                onClick={addToAnki} 
                disabled={ankiLoading || ankiSuccess} 
                className={`flex-1 py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all shadow-xl ${ankiSuccess ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.01]'}`}
              >
                {ankiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : ankiSuccess ? <CheckCircle className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                {ankiSuccess ? "Added to Anki!" : "Add to Anki"}
              </button>
            </div>

            {ankiError && (
              <p className="text-red-400 text-center font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {ankiError}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
