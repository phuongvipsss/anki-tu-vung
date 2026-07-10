"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/store";
import { Settings as SettingsIcon, Save, Database, Loader2, Check } from "lucide-react";

const SKILLS = ["vocabulary", "grammar", "listening", "speaking", "reading", "writing", "exam"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function SettingsPage() {
  const store = useSettingsStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local state for the form
  const [formData, setFormData] = useState({
    deckName: store.deckName,
    modelName: store.modelName,
    aiApiKey: store.aiApiKey,
    currentLevel: store.currentLevel,
    targetLevel: store.targetLevel,
    dailyStudyTime: store.dailyStudyTime || 30,
    examGoal: store.examGoal || "none",
    weakSkills: store.weakSkills || [],
    preferredTopics: (store.preferredTopics || []).join(", "),
    availableDays: store.availableDays || DAYS
  });

  useEffect(() => {
    // Fetch DB source of truth on load
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          const parsedWeakSkills = data.weakSkills ? JSON.parse(data.weakSkills) : [];
          const parsedTopics = data.preferredTopics ? JSON.parse(data.preferredTopics) : [];
          const parsedDays = data.availableDays ? JSON.parse(data.availableDays) : DAYS;

          setFormData({
            deckName: data.deckName || store.deckName,
            modelName: data.modelName || store.modelName,
            aiApiKey: data.aiApiKey || store.aiApiKey,
            currentLevel: data.currentLevel || store.currentLevel,
            targetLevel: data.targetLevel || store.targetLevel,
            dailyStudyTime: data.dailyStudyTime || 30,
            examGoal: data.examGoal || "none",
            weakSkills: parsedWeakSkills,
            preferredTopics: parsedTopics.join(", "),
            availableDays: parsedDays
          });

          // Sync store immediately from DB
          store.setDeckName(data.deckName || store.deckName);
          store.setModelName(data.modelName || store.modelName);
          store.setAiApiKey(data.aiApiKey || store.aiApiKey);
          store.setCurrentLevel(data.currentLevel || store.currentLevel);
          store.setTargetLevel(data.targetLevel || store.targetLevel);
          store.setDailyStudyTime(data.dailyStudyTime || 30);
          store.setExamGoal(data.examGoal || "none");
          store.setWeakSkills(parsedWeakSkills);
          store.setPreferredTopics(parsedTopics);
          store.setAvailableDays(parsedDays);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      weakSkills: prev.weakSkills.includes(skill)
        ? prev.weakSkills.filter((s: string) => s !== skill)
        : [...prev.weakSkills, skill]
    }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d: string) => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const topicsArray = formData.preferredTopics.split(",").map(s => s.trim()).filter(Boolean);

    const payload = {
      ...formData,
      preferredTopics: topicsArray
    };

    try {
      // 1. Write to DB First (Source of truth)
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to save to DB");

      // 2. Update local Zustand store cache
      store.setDeckName(formData.deckName);
      store.setModelName(formData.modelName);
      store.setAiApiKey(formData.aiApiKey);
      store.setCurrentLevel(formData.currentLevel);
      store.setTargetLevel(formData.targetLevel);
      store.setDailyStudyTime(Number(formData.dailyStudyTime));
      store.setExamGoal(formData.examGoal);
      store.setWeakSkills(formData.weakSkills);
      store.setPreferredTopics(topicsArray);
      store.setAvailableDays(formData.availableDays);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Error saving settings");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white pb-2 flex items-center gap-2">
          <SettingsIcon className="w-8 h-8 text-blue-500" /> Settings
        </h1>
        <p className="text-slate-400 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-500" /> Synced securely with local database.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">Language Goals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Current CEFR Level</label>
            <select name="currentLevel" value={formData.currentLevel} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Target CEFR Level</label>
            <select name="targetLevel" value={formData.targetLevel} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Exam Goal</label>
            <input type="text" name="examGoal" value={formData.examGoal} onChange={handleChange} placeholder="e.g. IELTS, TOEIC, none" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Daily Study Minutes</label>
            <input type="number" name="dailyStudyTime" value={formData.dailyStudyTime} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">AI Planner Preferences</h2>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Weak Skills (Select to prioritize)</label>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-4 py-2 rounded-xl text-sm capitalize transition-colors ${formData.weakSkills.includes(skill) ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Available Study Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-4 py-2 rounded-xl text-sm capitalize transition-colors ${formData.availableDays.includes(day) ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Preferred Topics (Comma separated)</label>
          <input type="text" name="preferredTopics" value={formData.preferredTopics} onChange={handleChange} placeholder="e.g. Technology, Travel, History..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">System Integrations</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Gemini API Key</label>
          <input type="password" name="aiApiKey" value={formData.aiApiKey} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Anki Deck Name</label>
            <input type="text" name="deckName" value={formData.deckName} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Anki Model Name</label>
            <input type="text" name="modelName" value={formData.modelName} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : saved ? <Check className="w-6 h-6 text-emerald-300" /> : <Save className="w-6 h-6" />}
        {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
