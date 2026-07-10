"use client";

import { useState } from "react";
import { Globe, Search, Loader2, Plus, Star } from "lucide-react";
import { useSettingsStore } from "@/lib/store";

export default function WebSearchPage() {
  const { aiApiKey, currentLevel, examGoal } = useSettingsStore();
  const [skill, setSkill] = useState("reading");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [savingUrl, setSavingUrl] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!aiApiKey) return alert("Missing Gemini API Key");
    if (!topic) return alert("Please enter a topic");
    
    setLoading(true);
    setResults([]);
    
    try {
      const res = await fetch("/api/resources/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiApiKey, skill, level: currentLevel, topic, examGoal })
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

  const handleSave = async (link: any) => {
    setSavingUrl(link.url);
    try {
      const res = await fetch("/api/resources/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: link.title,
          text: `Webpage Metadata:\nTitle: ${link.title}\nDomain: ${link.sourceDomain}\nSnippet: ${link.snippet}\nReason: ${link.reasonVi}`,
          sourceUrl: link.url,
          fileType: "webpage"
        })
      });
      
      if (!res.ok) throw new Error(await res.text());
      alert("Link saved to library!");
    } catch (e: any) {
      alert("Failed to save: " + e.message);
    } finally {
      setSavingUrl(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-white pb-2 flex items-center gap-2">
          <Globe className="w-8 h-8 text-blue-500" /> Web Resource Search
        </h1>
        <p className="text-slate-400">AI-curated articles, grammar guides, and reading materials.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-4">
        <select value={skill} onChange={e => setSkill(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500">
          <option value="reading">Reading / Articles</option>
          <option value="grammar">Grammar Guides</option>
          <option value="vocabulary">Vocabulary Lists</option>
          <option value="exam">Exam Practice</option>
        </select>
        
        <input 
          type="text" 
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g. Present Perfect, Tech News, IELTS Writing)..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500"
        />
        
        <button onClick={handleSearch} disabled={loading} className="btn-primary bg-blue-600 hover:bg-blue-500 border-none flex items-center justify-center gap-2 px-8">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Search
        </button>
      </div>

      {generatedQuery && (
        <div className="text-sm text-slate-400 text-center">
          Optimized Search Query: <span className="text-blue-400 font-mono bg-blue-500/10 px-2 py-1 rounded">{generatedQuery}</span>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {results.map((r, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl hover:border-blue-500/50 transition-colors flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 space-y-3">
                <a href={r.url} target="_blank" rel="noreferrer" className="text-xl font-bold text-blue-400 hover:underline">
                  {r.title}
                </a>
                <p className="text-xs text-slate-500 uppercase font-mono">{r.sourceDomain}</p>
                <p className="text-sm text-slate-300">{r.snippet}</p>
                
                <div className="flex gap-2 text-xs font-bold pt-2">
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded uppercase">Level {r.estimatedLevel}</span>
                  <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded flex items-center gap-1"><Star className="w-3 h-3"/> Score: {r.qualityScore}/10</span>
                </div>
                
                <div className="p-3 bg-slate-900/50 rounded-xl text-sm text-slate-400 italic border-l-2 border-blue-500">
                  {r.reasonVi}
                </div>
              </div>
              
              <button 
                onClick={() => handleSave(r)}
                disabled={savingUrl === r.url}
                className="btn-primary whitespace-nowrap bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border-none flex items-center gap-2"
              >
                {savingUrl === r.url ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save Resource
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
