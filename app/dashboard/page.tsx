import { prisma } from "@/lib/db";
import { BookOpen, Calendar, TrendingUp, Headphones, Edit3, BookA } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [vocabCount, mistakeCount, completedTasks, listeningCount, readingCount, writingCount] = await Promise.all([
    prisma.vocabulary.count(),
    prisma.mistakeLog.count(),
    prisma.dailyTask.count({ where: { status: "completed" } }),
    prisma.listeningAttempt.count(),
    prisma.readingAttempt.count(),
    prisma.writingSubmission.count()
  ]);

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-white pb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back! Here's your learning progress.</p>
      </div>

      {/* Overview Stats Phase 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Words Learned</p>
              <h2 className="text-3xl font-bold text-white">{vocabCount}</h2>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <Calendar className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Tasks Completed</p>
              <h2 className="text-3xl font-bold text-white">{completedTasks}</h2>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-orange-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Mistakes Logged</p>
              <h2 className="text-3xl font-bold text-white">{mistakeCount}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats Phase 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-cyan-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <Headphones className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Listening Labs</p>
              <h2 className="text-3xl font-bold text-white">{listeningCount}</h2>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <BookA className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Reading Labs</p>
              <h2 className="text-3xl font-bold text-white">{readingCount}</h2>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-rose-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/20 rounded-xl">
              <Edit3 className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Writing Labs</p>
              <h2 className="text-3xl font-bold text-white">{writingCount}</h2>
            </div>
          </div>
        </div>
      </div>
      
      <div className="glass-panel p-8 rounded-2xl flex-1 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-white mb-2">You're making great progress!</h2>
        <p className="text-slate-400 max-w-md">Continue working through your daily planner, reviewing your mistakes, and practicing in the new language labs.</p>
      </div>
    </div>
  );
}
