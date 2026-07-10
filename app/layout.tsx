import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { BookOpen, Settings, LayoutDashboard, Search, Calendar, FileText, AlertCircle, Layers, Activity, Headphones, BookA, Edit3 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "English Learning Platform",
  description: "A premium local-first English learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex bg-slate-900 text-slate-100`} suppressHydrationWarning>
        {/* Sidebar */}
        <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col hidden md:flex sticky top-0 h-screen">
          <div className="p-6">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              <BookOpen className="w-6 h-6 text-blue-500" />
              VocabFlow
            </Link>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            
            <Link href="/vocabulary" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
              <Search className="w-5 h-5" />
              <span className="font-medium">Vocabulary</span>
            </Link>
            
            <Link href="/planner" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Daily Planner</span>
            </Link>

            <Link href="/curriculum" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-500/20 transition-colors text-emerald-400 hover:text-emerald-300">
              <Layers className="w-5 h-5" />
              <span className="font-medium">Curriculum Builder</span>
            </Link>

            <Link href="/resources" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-pink-500/20 transition-colors text-pink-400 hover:text-pink-300">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Resource Library</span>
            </Link>
            
            <Link href="/grammar" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Grammar Lab</span>
            </Link>

            <Link href="/listening" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
              <Headphones className="w-5 h-5" />
              <span className="font-medium">Listening Lab</span>
            </Link>

            <Link href="/reading" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
              <BookA className="w-5 h-5" />
              <span className="font-medium">Reading Lab</span>
            </Link>

            <Link href="/writing" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
              <Edit3 className="w-5 h-5" />
              <span className="font-medium">Writing Lab</span>
            </Link>

            <Link href="/mistakes" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Mistake Log</span>
            </Link>

            <Link href="/review" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
              <Layers className="w-5 h-5" />
              <span className="font-medium">Review Queue</span>
            </Link>

            <Link href="/diagnostics" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
              <Activity className="w-5 h-5" />
              <span className="font-medium">Diagnostics</span>
            </Link>
          </nav>
          
          <div className="p-4 mt-auto">
            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors text-slate-300 hover:text-white">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full flex flex-col h-screen overflow-y-auto">
          {/* Mobile Header (Hidden on Desktop) */}
          <header className="md:hidden sticky top-0 z-50 bg-slate-800 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-blue-400">
              <BookOpen className="w-5 h-5" /> VocabFlow
            </Link>
            <Link href="/settings" className="p-2 text-slate-400 hover:text-white">
              <Settings className="w-5 h-5" />
            </Link>
          </header>
          
          <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
