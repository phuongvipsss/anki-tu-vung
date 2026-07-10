import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const mistakes = await prisma.mistakeLog.findMany({
      orderBy: { date: "desc" }
    });
    return NextResponse.json(mistakes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Log the mistake
    const mistake = await prisma.mistakeLog.create({
      data: {
        skillType: data.skillType,
        question: data.question,
        userAnswer: data.userAnswer,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
      }
    });

    // Handle Mistake-to-Review conversion
    // We use the question itself or a specific grammarPoint identifier as the sourceId.
    const sourceId = data.grammarPoint || data.question.substring(0, 100); 

    const existingReview = await prisma.reviewItem.findFirst({
      where: {
        sourceType: data.skillType + "_mistake",
        sourceId: sourceId,
        status: { in: ["pending", "dismissed"] }
      }
    });

    if (existingReview) {
      await prisma.reviewItem.update({
        where: { id: existingReview.id },
        data: {
          priorityScore: { increment: 1 },
          status: "pending",
          dueDate: new Date(), // Due immediately because they failed again
        }
      });
    } else {
      await prisma.reviewItem.create({
        data: {
          sourceType: data.skillType + "_mistake",
          sourceId: sourceId,
          priorityScore: 2,
          dueDate: new Date(), // Due immediately
        }
      });
    }

    return NextResponse.json(mistake);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
