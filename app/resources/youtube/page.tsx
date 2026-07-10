"use client";

import { useState } from "react";
import { PlayCircle, Search, Loader2, Plus, Star, Clock } from "lucide-react";
import { useSettingsStore } from "@/lib/store";

export default function YouTubeSearchPage() {
  const { aiApiKey, currentLevel } = useSettingsStore();
  const [skill, setSkill] = useState("listening");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!aiApiKey) return alert("Missing Gemini API Key");
    if (!topic) return alert("Please enter a topic");
    
    setLoading(true);
    setResults([]);
    
    try {
      const res = await fetch("/api/resources/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiApiKey, skill, level: currentLevel, topic })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setGeneratedQuery(data.query);
      setResults(data.results);
    } catch (e: any) {
      alert("Search failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (video: any) => {
    setSavingId(video.videoId);
    try {
      const res = await fetch("/api/resources/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: video.title,
          text: `Video Metadata:\nTitle: ${video.title}\nChannel: ${video.channelTitle}\nDuration: ${video.duration}\nReason: ${video.reasonVi}`,
          sourceUrl: video.url,
          fileType: "youtube"
        })
      });
      
      if (!res.ok) throw new Error(await res.text());
      alert("Video saved to library!");
    } catch (e: any) {
      alert("Failed to save: " + e.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-white pb-2 flex items-center gap-2">
          <PlayCircle className="w-8 h-8 text-red-500" /> Find Videos
        </h1>
        <p className="text-slate-400">AI-curated educational videos matched to your CEFR level.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-4">
        <select value={skill} onChange={e => setSkill(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-red-500">
          <option value="listening">Listening</option>
          <option value="speaking">Speaking / Shadowing</option>
          <option value="pronunciation">Pronunciation</option>
          <option value="vocabulary">Vocabulary</option>
        </select>
        
        <input 
          type="text" 
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g. Job Interviews, Travel, Daily Routine)..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-red-500"
        />
        
        <button onClick={handleSearch} disabled={loading} className="btn-primary bg-red-600 hover:bg-red-500 border-none flex items-center justify-center gap-2 px-8">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Search
        </button>
      </div>

      {generatedQuery && (
        <div className="text-sm text-slate-400 text-center">
          Optimized Search Query: <span className="text-red-400 font-mono bg-red-500/10 px-2 py-1 rounded">{generatedQuery}</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((v, i) => (
            <div key={i} className="glass-panel overflow-hidden rounded-2xl flex flex-col hover:border-red-500/50 transition-colors">
              <div className="h-48 bg-slate-800 relative bg-cover bg-center" style={{ backgroundImage: `url(${v.thumbnailUrl})` }}>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {v.duration}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-200 line-clamp-2">{v.title}</h3>
                <p className="text-sm text-slate-400 mt-1">{v.channelTitle}</p>
                
                <div className="flex gap-2 mt-3 text-xs font-bold">
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded uppercase flex gap-1">Level {v.estimatedLevel}</span>
                  <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded flex items-center gap-1"><Star className="w-3 h-3"/> Score: {v.qualityScore}/10</span>
                </div>
                
                <div className="mt-4 p-3 bg-slate-900/50 rounded-xl text-sm text-slate-300 italic border-l-2 border-red-500">
                  {v.reasonVi}
                </div>

                <button 
                  onClick={() => handleSave(v)}
                  disabled={savingId === v.videoId}
                  className="mt-auto pt-4 w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 font-bold transition-colors"
                >
                  {savingId === v.videoId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Save to Library
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
