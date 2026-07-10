import { NextResponse } from "next/server";
import { addVocabToAnki, VocabCard } from "@/lib/anki";

export async function POST(request: Request) {
  try {
    const card: VocabCard = await request.json();
    
    if (!card.word || !card.deckName || !card.modelName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await addVocabToAnki(card);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Anki Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
