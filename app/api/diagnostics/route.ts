import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // 1. Check DB Connection and get counts
    const [
      vocabCount,
      mistakeCount,
      reviewCount,
      dailyTaskCount,
      completedTaskCount,
      pendingAiTaskCount,
      settings,
      resourceCount,
      lessonCount,
      curriculumCount
    ] = await prisma.$transaction([
      prisma.vocabulary.count(),
      prisma.mistakeLog.count(),
      prisma.reviewItem.count(),
      prisma.dailyTask.count(),
      prisma.dailyTask.count({ where: { status: "completed" } }),
      prisma.dailyTask.count({ where: { status: "pending", source: { in: ["ai_generated", "curriculum"] } } }),
      prisma.settings.findUnique({ where: { id: 1 } }),
      prisma.resource.count(),
      prisma.lesson.count(),
      prisma.curriculum.count()
    ]);

    // 2. Check AnkiConnect Status
    let ankiStatus = false;
    try {
      const ankiRes = await fetch("http://127.0.0.1:8765", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "version", version: 6 })
      });
      if (ankiRes.ok) ankiStatus = true;
    } catch (e) {
      ankiStatus = false;
    }

    return NextResponse.json({
      db: true,
      settingsLoaded: !!settings,
      vocabCount,
      mistakeCount,
      reviewCount,
      dailyTaskCount,
      completedTaskCount,
      pendingAiTaskCount,
      resourceCount,
      lessonCount,
      curriculumCount,
      anki: ankiStatus,
      env: process.env.NODE_ENV
    });
  } catch (error: any) {
    return NextResponse.json({ 
      db: false, 
      error: error.message 
    }, { status: 500 });
  }
}
