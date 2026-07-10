import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { searchWeb } from "@/lib/providers";

export async function POST(request: Request) {
  try {
    const { aiApiKey, skill, level, topic, examGoal } = await request.json();

    if (!aiApiKey) {
      return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: aiApiKey });

    // 1. Generate optimized search query
    const queryPrompt = `Generate a short web search query for an ESL student at ${level} level wanting to practice ${skill} about "${topic}" (Exam goal: ${examGoal}). Just output the raw search query string (max 5 words), nothing else.`;
    const queryResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: queryPrompt });
    const query = queryResponse.text?.trim() || `${topic} english ${skill}`;

    // 2. Fetch raw links from provider
    const rawLinks = await searchWeb(query, 8);

    // 3. AI Ranking and Filtering
    const rankPrompt = `
      You are an expert ESL curriculum designer. Review the following web search results for a ${level} student practicing ${skill} about "${topic}".
      Select the best educational resources. Filter out spam, low-quality SEO pages, pirated documents, and paywalled content. Prefer official learning sites and clear grammar/reference pages.
      Return a STRICT JSON array of the approved resources, adding an "estimatedLevel", a 1-10 "qualityScore", and a short "reasonVi" (in Vietnamese) explaining why it's good for the student.

      Resources:
      ${JSON.stringify(rawLinks, null, 2)}
    `;

    const rankingSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          url: { type: Type.STRING },
          snippet: { type: Type.STRING },
          sourceDomain: { type: Type.STRING },
          estimatedLevel: { type: Type.STRING },
          qualityScore: { type: Type.INTEGER },
          reasonVi: { type: Type.STRING },
        },
        required: ["title", "url", "snippet", "sourceDomain", "estimatedLevel", "qualityScore", "reasonVi"]
      }
    };

    const rankResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: rankPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: rankingSchema,
      }
    });

    const approvedLinks = JSON.parse(rankResponse.text || "[]");

    // Sort by quality score
    approvedLinks.sort((a: any, b: any) => b.qualityScore - a.qualityScore);

    return NextResponse.json({ query, results: approvedLinks });
  } catch (error: any) {
    console.error("Web Search Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
