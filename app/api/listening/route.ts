import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { aiApiKey, topic, level } = await request.json();

    if (!aiApiKey) {
      return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: aiApiKey });

    const prompt = `
    Generate a short English listening passage about "${topic}" at the CEFR ${level} level.
    
    Return ONLY a raw JSON object with this exact structure (no markdown, no backticks):
    {
      "title": "Title of passage",
      "level": "${level}",
      "topic": "${topic}",
      "transcript": "Full text of the passage",
      "sentences": ["Sentence 1", "Sentence 2", "Sentence 3"],
      "vocabulary": ["word1", "word2", "word3"],
      "comprehensionQuestions": [
        {
          "question": "Question 1?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanationVi": "Vietnamese explanation"
        }
      ],
      "gapFillItems": [
        {
          "sentenceWithBlank": "A sentence with a ____ blank.",
          "answer": "missing_word",
          "hintVi": "Vietnamese hint"
        }
      ]
    }
    
    Requirements:
    - Include exactly 3 comprehensionQuestions.
    - Include exactly 3 gapFillItems.
    - Ensure 'sentences' array contains the transcript broken down sentence-by-sentence.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    let text = response.text || "{}";
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);

    // Save the exercise to the DB
    const exercise = await prisma.listeningExercise.create({
      data: {
        title: parsed.title,
        level: parsed.level,
        topic: parsed.topic,
        transcript: parsed.transcript,
        questions: JSON.stringify(parsed.comprehensionQuestions),
        gapFillItems: JSON.stringify(parsed.gapFillItems)
      }
    });

    return NextResponse.json({ ...parsed, id: exercise.id });
  } catch (error: any) {
    console.error("Listening Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Save attempt
  try {
    const data = await request.json();
    const attempt = await prisma.listeningAttempt.create({
      data: {
        exerciseId: data.exerciseId,
        userTranscript: data.userTranscript,
        score: data.score,
        mistakes: JSON.stringify(data.mistakes)
      }
    });
    return NextResponse.json(attempt);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
