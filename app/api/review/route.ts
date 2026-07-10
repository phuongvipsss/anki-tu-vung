import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const now = new Date();

    const items = await prisma.reviewItem.findMany({
      where: {
        status: "pending",
        dueDate: { lte: now }
      },
      orderBy: [
        { priorityScore: "desc" },
        { dueDate: "asc" }
      ],
      take: limit
    });
    
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, confidence } = await request.json(); // "again", "hard", "good", "easy"
    
    const existing = await prisma.reviewItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Simple Spaced Repetition logic
    let daysToAdd = 1;
    let newStatus = "pending";

    if (confidence === "again") daysToAdd = 0; // Same day or next day
    else if (confidence === "hard") daysToAdd = 2;
    else if (confidence === "good") daysToAdd = 4;
    else if (confidence === "easy") {
      daysToAdd = 7;
      if (existing.reviewCount > 3) newStatus = "completed"; // Graduate after enough easy reviews
    }

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + daysToAdd);

    const updated = await prisma.reviewItem.update({
      where: { id },
      data: {
        confidence,
        reviewCount: { increment: 1 },
        lastReviewedAt: new Date(),
        dueDate: nextDueDate,
        status: newStatus
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
