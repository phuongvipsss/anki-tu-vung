import { NextResponse } from "next/server";
import { searchImages } from "@/lib/images";

export async function POST(request: Request) {
  try {
    const { query, apiKey } = await request.json();
    if (!query || !apiKey) {
      return NextResponse.json({ error: "Missing query or API key" }, { status: 400 });
    }
    const images = await searchImages(query, apiKey);
    return NextResponse.json({ images });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
