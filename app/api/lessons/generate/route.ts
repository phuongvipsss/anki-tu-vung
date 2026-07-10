import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GoogleGenAI, Type, Schema } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { aiApiKey, resourceId, currentLevel, targetLevel, examGoal } = await request.json();

    if (!aiApiKey) return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 400 });
    if (!resourceId) return NextResponse.json({ error: "Missing resourceId" }, { status: 400 });

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: { chunks: true }
    });

    if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

    const textContent = resource.chunks.map(c => c.text).join("\\n\\n");

    const ai = new GoogleGenAI({ apiKey: aiApiKey });

    const prompt = `
      You are an expert ESL lesson creator. Create a comprehensive English lesson based on the following resource content.
      Target Student Level: ${currentLevel} (aiming for ${targetLevel}).
      Exam Goal: ${examGoal || 'none'}
      
      Resource Title: ${resource.title}
      Resource Type: ${resource.type}
      
      Content:
      ${textContent.substring(0, 10000)} // Truncated to avoid token limits if too large
      
      Design a structured lesson with:
      1. A short warmup.
      2. Main learning content (explanations or key points).
      3. At least 3 practice tasks (e.g. multiple choice, fill in the blank, reading comprehension).
      4. Vocabulary review items.
      5. Anki flashcard candidates.
    `;

    const lessonSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        lessonTitle: { type: Type.STRING },
        level: { type: Type.STRING },
        skill: { type: Type.STRING },
        objective: { type: Type.STRING },
        estimatedMinutes: { type: Type.INTEGER },
        warmup: { type: Type.STRING },
        mainContent: { type: Type.STRING },
        practiceTasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              instruction: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanationVi: { type: Type.STRING },
              successCriteria: { type: Type.STRING }
            },
            required: ["type", "instruction", "question", "correctAnswer", "explanationVi"]
          }
        },
        reviewItems: { type: Type.ARRAY, items: { type: Type.STRING } },
        ankiCandidates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["front", "back"]
          }
        }
      },
      required: ["lessonTitle", "level", "skill", "objective", "estimatedMinutes", "warmup", "mainContent", "practiceTasks"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonSchema,
      }
    });

    const parsedLesson = JSON.parse(response.text || "{}");

    // Save lesson to DB
    const lesson = await prisma.lesson.create({
      data: {
        resourceId: resource.id,
        title: parsedLesson.lessonTitle,
        level: parsedLesson.level || currentLevel,
        skill: parsedLesson.skill || "reading",
        objective: parsedLesson.objective || "",
        estimatedMinutes: parsedLesson.estimatedMinutes || 20,
        content: JSON.stringify(parsedLesson)
      }
    });

    // Mark resource as analyzed/lesson created
    await prisma.resource.update({
      where: { id: resource.id },
      data: { status: "analyzed" }
    });

    return NextResponse.json(lesson);
  } catch (error: any) {
    console.error("Lesson Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
