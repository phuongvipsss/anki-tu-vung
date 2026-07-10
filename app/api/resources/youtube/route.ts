import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { searchYouTube } from "@/lib/providers";

export async function POST(request: Request) {
  try {
    const { aiApiKey, skill, level, topic } = await request.json();

    if (!aiApiKey) {
      return NextResponse.json({ error: "Missing Gemini API Key" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: aiApiKey });

    // 1. Generate optimized search query
    const queryPrompt = `Generate a short YouTube search query for an ESL student at ${level} level wanting to practice ${skill} about "${topic}". Just output the raw search query string (max 5 words), nothing else.`;
    const queryResponse = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: queryPrompt });
    const query = queryResponse.text?.trim() || `${topic} english lesson`;

    // 2. Fetch raw videos from provider
    const rawVideos = await searchYouTube(query, 8);

    // 3. AI Ranking and Filtering
    const rankPrompt = `
      You are an expert ESL curriculum designer. Review the following YouTube videos for a ${level} student practicing ${skill} about "${topic}".
      Select the best educational videos. Filter out clickbait, spam, or videos that are too advanced.
      Return a STRICT JSON array of the approved videos, adding an "estimatedLevel", a 1-10 "qualityScore", and a short "reasonVi" (in Vietnamese) explaining why it's good for the student.

      Videos:
      ${JSON.stringify(rawVideos, null, 2)}
    `;

    const rankingSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          videoId: { type: Type.STRING },
          title: { type: Type.STRING },
          channelTitle: { type: Type.STRING },
          url: { type: Type.STRING },
          thumbnailUrl: { type: Type.STRING },
          duration: { type: Type.STRING },
          publishedAt: { type: Type.STRING },
          estimatedLevel: { type: Type.STRING },
          qualityScore: { type: Type.INTEGER },
          reasonVi: { type: Type.STRING },
        },
        required: ["videoId", "title", "channelTitle", "url", "thumbnailUrl", "duration", "publishedAt", "estimatedLevel", "qualityScore", "reasonVi"]
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

    const approvedVideos = JSON.parse(rankResponse.text || "[]");

    // Sort by quality score
    approvedVideos.sort((a: any, b: any) => b.qualityScore - a.qualityScore);

    return NextResponse.json({ query, results: approvedVideos });
  } catch (error: any) {
    console.error("YouTube Search Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
