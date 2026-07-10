import { NextResponse } from "next/server";
import { generateExamples } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const { word, meaningVi, apiKey } = await request.json();
    
    if (!word || !meaningVi || !apiKey) {
      return NextResponse.json({ error: "Missing required fields (word, meaningVi, apiKey)" }, { status: 400 });
    }

    const result = await generateExamples(word, meaningVi, apiKey);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
