import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { aiApiKey, promptText, writingType, userText, level } = await request.json();

    if (!aiApiKey) {
      return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: aiApiKey });

    const prompt = `
    You are an expert IELTS/English Writing Examiner. 
    The student is currently at level: ${level}.
    Writing Task Type: ${writingType}
    Prompt/Topic: ${promptText}
    Student's Text: 
    """
    ${userText}
    """
    
    Evaluate the student's text. Return ONLY a raw JSON object with this exact structure (no markdown, no backticks):
    {
      "correctedText": "The text with minimal grammar/spelling corrections",
      "naturalVersion": "A highly native, idiomatic rewrite of the text",
      "overallFeedbackVi": "General feedback in Vietnamese",
      "estimatedLevel": "Estimated CEFR level of the submission (e.g. B1)",
      "errors": [
        {
          "type": "grammar",
          "original": "incorrect phrase",
          "correction": "correct phrase",
          "explanationVi": "Why it's wrong in Vietnamese",
          "severity": "high",
          "rule": "The grammar rule",
          "practiceSuggestion": "How to practice this"
        }
      ],
      "strongPoints": ["Good vocab", "Clear structure"],
      "weakPoints": ["Frequent tense errors"],
      "newVocabularySuggestions": ["word1", "word2"],
      "rewriteTask": "A specific 1-sentence prompt for them to rewrite to practice their weakest point",
      "ankiCandidates": [
        {
          "front": "Fill in: He ____ (go) to the store yesterday.",
          "back": "went",
          "tag": "writing-error"
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
    
    const parsed = JSON.parse(text);

    // Save to DB
    const submission = await prisma.writingSubmission.create({
      data: {
        prompt: promptText,
        writingType: writingType,
        userText: userText,
        level: level,
      }
    });

    const correction = await prisma.writingCorrection.create({
      data: {
        submissionId: submission.id,
        correctedText: parsed.correctedText,
        naturalVersion: parsed.naturalVersion,
        overallFeedbackVi: parsed.overallFeedbackVi,
        estimatedLevel: parsed.estimatedLevel,
        errors: JSON.stringify(parsed.errors),
        ankiCandidates: JSON.stringify(parsed.ankiCandidates)
      }
    });

    // Also log severe errors to MistakeLog for Review Queue
    const highSeverityErrors = (parsed.errors || []).filter((e: any) => e.severity === "high" || e.severity === "medium");
    for (const err of highSeverityErrors) {
      await prisma.mistakeLog.create({
        data: {
          skillType: "writing",
          question: `Writing Error (${err.type}): ${err.original}`,
          userAnswer: err.original,
          correctAnswer: err.correction,
          explanation: err.explanationVi,
        }
      });
      // Mistake-to-Review logic could be triggered here or separately handled by Review UI pulling writing_mistake.
      // Let's create a review item directly since it's backend.
      await prisma.reviewItem.create({
        data: {
          sourceType: "writing_mistake",
          sourceId: err.original,
          priorityScore: 3, // Writing mistakes are high priority
        }
      });
    }

    return NextResponse.json({ ...parsed, submissionId: submission.id, correctionId: correction.id });
  } catch (error: any) {
    console.error("Writing Evaluation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
