import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string(),
  skill: z.enum(["vocabulary", "grammar", "listening", "speaking", "reading", "writing", "exam", "review"]),
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  instructions: z.string(),
  expectedUserAction: z.string(),
  successCriteria: z.string(),
  relatedMistakeIds: z.array(z.string()).optional(),
  relatedVocabIds: z.array(z.string()).optional(),
  canAddToAnki: z.boolean(),
  reason: z.string(),
  isOfflineTask: z.boolean()
});

const planSchema = z.object({
  plan: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      totalEstimatedMinutes: z.number().int().nonnegative(),
      tasks: z.array(taskSchema)
    })
  )
});

export async function POST(request: Request) {
  try {
    const { aiApiKey } = await request.json();

    if (!aiApiKey) {
      return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 400 });
    }

    // 1. Fetch Source of Truth Settings
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) throw new Error("Settings not found");

    const dailyStudyMinutes = settings.dailyStudyTime;
    const availableDays = settings.availableDays ? JSON.parse(settings.availableDays) : [];
    
    if (availableDays.length === 0) {
      return NextResponse.json({ error: "No available days selected in Settings." }, { status: 400 });
    }

    // 2. Fetch Massive Context
    const [recentMistakes, pendingReviewItems, learnedVocab, difficultVocab, tasks] = await Promise.all([
      prisma.mistakeLog.findMany({ take: 10, orderBy: { date: "desc" }, select: { id: true, skillType: true, question: true } }),
      prisma.reviewItem.findMany({ where: { status: "pending" }, take: 10, select: { id: true, sourceType: true } }),
      prisma.vocabulary.findMany({ take: 10, orderBy: { addedAt: "desc" }, select: { id: true, word: true } }),
      prisma.vocabulary.findMany({ where: { difficulty: "hard" }, take: 10, select: { id: true, word: true } }),
      prisma.dailyTask.findMany({
        where: { date: { gte: new Date(new Date().setHours(0,0,0,0)) } },
        select: { status: true, title: true }
      })
    ]);

    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const incompleteTasks = tasks.filter(t => t.status === "pending").length;

    // 3. Setup Gemini
    const ai = new GoogleGenAI({ apiKey: aiApiKey });

    const prompt = `
    You are an expert English Language Tutor AI. Generate a highly personalized 7-day study plan.
    
    Student Profile:
    - Current Level: ${settings.currentLevel}
    - Target Level: ${settings.targetLevel}
    - Exam Goal: ${settings.examGoal}
    - Daily Study Time limit: ${dailyStudyMinutes} minutes/day
    - Weak Skills: ${settings.weakSkills || "None"}
    - Preferred Topics: ${settings.preferredTopics || "General"}
    - Available Study Days: ${settings.availableDays}
    
    Context:
    - Recent Mistakes: ${JSON.stringify(recentMistakes)}
    - Pending Reviews: ${pendingReviewItems.length} items
    - Difficult Vocab: ${JSON.stringify(difficultVocab)}
    
    Rules for Generation:
    1. STRICT JSON ONLY. Match the requested schema exactly.
    2. Total estimated minutes per day MUST NOT exceed ${dailyStudyMinutes}.
    3. Include review tasks BEFORE new learning tasks.
    4. Prioritize tasks addressing repeated mistakes and weak skills.
    5. If Current Level is below B1, avoid long academic reading tasks.
    6. If Exam Goal is IELTS/TOEIC, include exam-style practice at least 3 times a week.
    7. Start the plan from today (use date offsets). Today is: ${new Date().toISOString().split('T')[0]}.
    8. ONLY generate days that exist in the 'Available Study Days' array. Skip days not in the array.
    9. For Speaking tasks, set "isOfflineTask": true since the speaking lab is not yet built.
    
    Output JSON Schema:
    {
      "plan": [
        {
          "date": "YYYY-MM-DD",
          "totalEstimatedMinutes": 0,
          "tasks": [
            {
              "title": "",
              "skill": "vocabulary|grammar|listening|speaking|reading|writing|exam|review",
              "estimatedMinutes": 0,
              "difficulty": "easy|medium|hard",
              "instructions": "Clear instruction for the user",
              "expectedUserAction": "What the user needs to actually do",
              "successCriteria": "How to know it's done",
              "relatedMistakeIds": [],
              "relatedVocabIds": [],
              "canAddToAnki": false,
              "reason": "Why this task was assigned",
              "isOfflineTask": false
            }
          ]
        }
      ]
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    let text = response.text || "{}";
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    // 4. Validate with Zod
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: "AI returned malformed JSON." }, { status: 400 });
    }

    const validation = planSchema.safeParse(parsedData);
    if (!validation.success) {
      return NextResponse.json({ 
        error: "AI JSON failed schema validation.", 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const validPlan = validation.data.plan;
    
    if (validPlan.length === 0) {
      return NextResponse.json({ error: "Generated plan is empty." }, { status: 400 });
    }

    // Enforce daily limits
    for (const day of validPlan) {
      if (day.totalEstimatedMinutes > dailyStudyMinutes) {
        return NextResponse.json({ error: `Generated plan exceeded daily limit of ${dailyStudyMinutes} mins on ${day.date}.` }, { status: 400 });
      }
    }

    // 5. Database Transaction (Replacement Logic)
    // Only delete future, AI-generated, pending tasks.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.$transaction(async (tx) => {
      // Delete replaceable tasks
      await tx.dailyTask.deleteMany({
        where: {
          date: { gte: today },
          source: "ai_generated",
          status: "pending"
        }
      });

      // Insert new tasks
      for (const day of validPlan) {
        const dateObj = new Date(day.date);
        for (const t of day.tasks) {
          await tx.dailyTask.create({
            data: {
              taskType: t.skill, // deprecated fallback
              title: t.title,
              skill: t.skill,
              estimatedMinutes: t.estimatedMinutes,
              difficulty: t.difficulty,
              instructions: t.instructions,
              expectedUserAction: t.expectedUserAction,
              successCriteria: t.successCriteria,
              relatedMistakeIds: t.relatedMistakeIds ? JSON.stringify(t.relatedMistakeIds) : null,
              relatedVocabIds: t.relatedVocabIds ? JSON.stringify(t.relatedVocabIds) : null,
              canAddToAnki: t.canAddToAnki,
              source: t.isOfflineTask ? "manual" : "ai_generated",
              date: dateObj
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true, replacedDays: validPlan.length });
  } catch (error: any) {
    console.error("Planner Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
