import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GoogleGenAI, Type, Schema } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { aiApiKey } = await request.json();
    if (!aiApiKey) return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 400 });

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) throw new Error("Settings not found");

    const [mistakes, reviewItems, resources, completedTasks] = await Promise.all([
      prisma.mistakeLog.findMany({ take: 15, orderBy: { date: "desc" } }),
      prisma.reviewItem.count({ where: { status: "pending" } }),
      prisma.resource.findMany({ where: { status: { in: ["imported", "analyzed"] } }, take: 20 }),
      prisma.dailyTask.findMany({ where: { status: "completed" }, take: 20, orderBy: { date: "desc" } })
    ]);

    const ai = new GoogleGenAI({ apiKey: aiApiKey });

    const prompt = `
      You are an expert ESL Curriculum Director. Create a comprehensive 7-day Curriculum Plan.
      
      Student Profile:
      - Current Level: ${settings.currentLevel}
      - Target Level: ${settings.targetLevel}
      - Exam Goal: ${settings.examGoal}
      - Daily Minutes: ${settings.dailyStudyTime}
      - Weak Skills: ${settings.weakSkills || "None"}
      - Available Days: ${settings.availableDays}
      
      Context:
      - Pending Review Items: ${reviewItems}
      - Recent Mistakes: ${JSON.stringify(mistakes.map(m => m.skillType + ": " + m.question))}
      - Available External Resources (use these IDs as sourceId for resource-backed tasks): 
      ${JSON.stringify(resources.map(r => ({ id: r.id, title: r.title, type: r.type })))}
      
      Rules:
      1. Review before new learning.
      2. Integrate the available external resources.
      3. Only schedule on Available Days.
      4. DO NOT EXCEED daily minutes limit.
      5. Strict JSON output.
    `;

    const curriculumSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        curriculumTitle: { type: Type.STRING },
        durationDays: { type: Type.INTEGER },
        targetLevel: { type: Type.STRING },
        mainGoal: { type: Type.STRING },
        weeklyFocus: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { week: { type: Type.INTEGER }, focus: { type: Type.STRING }, skills: { type: Type.ARRAY, items: { type: Type.STRING } }, expectedOutcome: { type: Type.STRING } },
            required: ["week", "focus", "skills", "expectedOutcome"]
          }
        },
        dailyPlan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              totalEstimatedMinutes: { type: Type.INTEGER },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    skill: { type: Type.STRING },
                    estimatedMinutes: { type: Type.INTEGER },
                    difficulty: { type: Type.STRING },
                    sourceType: { type: Type.STRING }, // "lesson" | "resource" | "review" | "generated"
                    sourceId: { type: Type.STRING }, // map to resource.id if applicable
                    instructions: { type: Type.STRING },
                    expectedUserAction: { type: Type.STRING },
                    successCriteria: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["title", "skill", "estimatedMinutes", "sourceType", "instructions", "expectedUserAction"]
                }
              }
            },
            required: ["date", "totalEstimatedMinutes", "tasks"]
          }
        },
        milestones: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { date: { type: Type.STRING }, description: { type: Type.STRING }, measurement: { type: Type.STRING } },
            required: ["date", "description", "measurement"]
          }
        }
      },
      required: ["curriculumTitle", "durationDays", "targetLevel", "mainGoal", "weeklyFocus", "dailyPlan", "milestones"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: curriculumSchema,
      }
    });

    const parsedPlan = JSON.parse(response.text || "{}");

    // Save curriculum and tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const curr = await prisma.$transaction(async (tx) => {
      // 1. Delete pending AI tasks to replace with new curriculum
      await tx.dailyTask.deleteMany({
        where: {
          date: { gte: today },
          source: { in: ["ai_generated", "curriculum"] },
          status: "pending"
        }
      });

      // 2. Save Curriculum Record
      const curriculum = await tx.curriculum.create({
        data: {
          title: parsedPlan.curriculumTitle || "New Curriculum",
          targetLevel: parsedPlan.targetLevel || settings.targetLevel,
          durationDays: parsedPlan.durationDays || 7,
          mainGoal: parsedPlan.mainGoal || "Improve English",
          plan: JSON.stringify(parsedPlan)
        }
      });

      // 3. Insert into DailyTask
      if (parsedPlan.dailyPlan) {
        for (const day of parsedPlan.dailyPlan) {
          const dateObj = new Date(day.date);
          for (const t of day.tasks) {
            await tx.dailyTask.create({
              data: {
                taskType: t.skill,
                title: t.title,
                skill: t.skill,
                estimatedMinutes: t.estimatedMinutes,
                difficulty: t.difficulty,
                instructions: t.instructions,
                expectedUserAction: t.expectedUserAction,
                successCriteria: t.successCriteria,
                source: "curriculum",
                date: dateObj,
                relatedVocabIds: t.sourceId ? JSON.stringify([t.sourceId]) : null
              }
            });
          }
        }
      }

      return curriculum;
    });

    return NextResponse.json({ success: true, curriculumId: curr.id, data: parsedPlan });
  } catch (error: any) {
    console.error("Curriculum Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
