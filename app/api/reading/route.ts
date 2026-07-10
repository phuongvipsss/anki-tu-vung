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
    Generate an English reading passage about "${topic}" at the CEFR ${level} level.
    
    Return ONLY a raw JSON object with this exact structure (no markdown, no backticks):
    {
      "title": "Title of passage",
      "level": "${level}",
      "topic": "${topic}",
      "passage": "Full text of the reading passage. Use multiple paragraphs.",
      "estimatedReadingMinutes": 3,
      "keyVocabulary": [
        {
          "word": "important_word",
          "meaningVi": "Vietnamese meaning",
          "example": "Example sentence from the text"
        }
      ],
      "questions": [
        {
          "type": "main_idea",
          "question": "What is the main idea?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanationVi": "Vietnamese explanation"
        },
        {
          "type": "true_false_not_given",
          "question": "The author states that...",
          "options": ["True", "False", "Not Given"],
          "correctAnswer": "True",
          "explanationVi": "Vietnamese explanation"
        }
      ]
    }
    
    Requirements:
    - Include exactly 4 questions (mix of main_idea, detail, inference, true_false_not_given, vocab_context).
    - Include 5 keyVocabulary items.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    let text = response.text || "{}";
    text = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);

    // Save to DB
    const passage = await prisma.readingPassage.create({
      data: {
        title: parsed.title,
        level: parsed.level,
        topic: parsed.topic,
        passage: parsed.passage,
        vocabulary: JSON.stringify(parsed.keyVocabulary),
        questions: JSON.stringify(parsed.questions)
      }
    });

    return NextResponse.json({ ...parsed, id: passage.id });
  } catch (error: any) {
    console.error("Reading Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Save attempt
  try {
    const data = await request.json();
    const attempt = await prisma.readingAttempt.create({
      data: {
        passageId: data.passageId,
        answers: JSON.stringify(data.answers),
        score: data.score,
        mistakes: JSON.stringify(data.mistakes)
      }
    });
    return NextResponse.json(attempt);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
