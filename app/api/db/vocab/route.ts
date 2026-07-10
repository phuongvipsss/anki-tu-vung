import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Upsert to handle re-saving without unique constraint error
    const vocab = await prisma.vocabulary.upsert({
      where: { 
        word_partOfSpeech: {
          word: data.word,
          partOfSpeech: data.partOfSpeech || "unknown"
        }
      },
      update: {
        ipa: data.ipa,
        partOfSpeech: data.partOfSpeech || "unknown",
        definitionEn: data.definitionEn,
        meaningVi: data.meaningVi,
        examples: data.examples,
        synonyms: data.synonyms,
        collocations: data.collocations,
        level: data.level,
      },
      create: {
        word: data.word,
        ipa: data.ipa,
        partOfSpeech: data.partOfSpeech || "unknown",
        definitionEn: data.definitionEn,
        meaningVi: data.meaningVi,
        examples: data.examples,
        synonyms: data.synonyms,
        collocations: data.collocations,
        level: data.level,
      }
    });

    return NextResponse.json({ success: true, vocab });
  } catch (error: any) {
    console.error("DB Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
