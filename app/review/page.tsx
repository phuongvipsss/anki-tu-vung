"use client";

import { useState, useEffect } from "react";
import { Layers, Loader2, PlayCircle, Star, Frown, Smile } from "lucide-react";
import { motion } from "framer-motion";

type ReviewItem = {
  id: string;
  sourceType: string;
  sourceId: string;
  priorityScore: number;
  reviewCount: number;
};

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  async function fetchQueue() {
    try {
      const res = await fetch("/api/review?limit=20");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (confidence: string) => {
    const item = items[currentItemIndex];
    if (!item) return;

    try {
      await fetch("/api/review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, confidence })
      });
      
      // Move to next
      setShowAnswer(false);
      setCurrentItemIndex(prev => prev + 1);
    } catch (err) {
      console.error("Failed to submit review", err);
    }
  };

  if (loading) return <div className="text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const currentItem = items[currentItemIndex];

  return (
    <div className="space-y-8 max-w-2xl mx-auto h-full flex flex-col pt-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white pb-2 flex items-center justify-center gap-2">
          <Layers className="w-8 h-8 text-blue-500" /> Review Queue
        </h1>
        <p className="text-slate-400">
          {items.length - currentItemIndex} pending items to review today.
        </p>
      </div>

      {!currentItem ? (
        <div className="glass-panel p-10 rounded-2xl text-center space-y-4">
          <Star className="w-16 h-16 text-yellow-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">All Caught Up!</h2>
          <p className="text-slate-400">You have no pending items in your review queue.</p>
        </div>
      ) : (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-8 rounded-2xl flex-1 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full capitalize font-semibold">
                {currentItem.sourceType.replace("_", " ")}
              </span>
              <span className="text-slate-500 font-medium">Priority: {currentItem.priorityScore}</span>
            </div>
            
            <div className="py-10 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">{currentItem.sourceId}</h2>
              {/* In a fully expanded version, we would fetch the exact MistakeLog or Vocabulary details using sourceId to render the prompt */}
              <p className="text-slate-400">Recall the rule or meaning associated with this item.</p>
            </div>
          </div>

          {!showAnswer ? (
            <button 
              onClick={() => setShowAnswer(true)}
              className="btn-primary w-full py-4 text-xl font-bold"
            >
              Show Answer
            </button>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 text-center">
                <p className="text-slate-300">Did you remember it correctly?</p>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <button onClick={() => submitReview("again")} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/20 transition">
                  <Frown className="w-6 h-6 mx-auto mb-2" /> Again (1d)
                </button>
                <button onClick={() => submitReview("hard")} className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold hover:bg-orange-500/20 transition">
                  Hard (2d)
                </button>
                <button onClick={() => submitReview("good")} className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold hover:bg-blue-500/20 transition">
                  Good (4d)
                </button>
                <button onClick={() => submitReview("easy")} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500/20 transition">
                  <Smile className="w-6 h-6 mx-auto mb-2" /> Easy (7d)
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
