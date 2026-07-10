import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper to chunk text roughly by word count
function chunkText(text: string, maxWords = 500): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= maxWords) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [];
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}

export async function POST(request: Request) {
  try {
    const { title, text, fileType, sourceUrl } = await request.json();

    if (!title || !text) {
      return NextResponse.json({ error: "Title and text content are required." }, { status: 400 });
    }

    // Determine type
    let type = "document";
    if (sourceUrl?.includes("youtube.com") || sourceUrl?.includes("youtu.be")) {
      type = "youtube";
    } else if (sourceUrl?.startsWith("http")) {
      type = "webpage";
    }

    const chunks = chunkText(text);

    // Save to DB
    const resource = await prisma.resource.create({
      data: {
        type,
        title,
        sourceUrl,
        fileType: fileType || "txt",
        chunks: {
          create: chunks.map((chunkText, i) => ({
            chunkIndex: i,
            text: chunkText,
            tokenCount: chunkText.split(/\s+/).length // rough estimation
          }))
        }
      }
    });

    return NextResponse.json({ success: true, resourceId: resource.id, chunksCreated: chunks.length });
  } catch (error: any) {
    console.error("Resource Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const resources = await prisma.resource.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(resources);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
