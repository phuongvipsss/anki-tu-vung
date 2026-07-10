import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 1 }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 1 }
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Convert arrays back to JSON strings if they aren't already
    const updateData: any = { ...data };
    
    if (Array.isArray(data.weakSkills)) updateData.weakSkills = JSON.stringify(data.weakSkills);
    if (Array.isArray(data.preferredTopics)) updateData.preferredTopics = JSON.stringify(data.preferredTopics);
    if (Array.isArray(data.availableDays)) updateData.availableDays = JSON.stringify(data.availableDays);

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        ...updateData
      }
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Settings POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
