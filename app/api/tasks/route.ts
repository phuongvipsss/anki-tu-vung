import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await prisma.dailyTask.findMany({
      where: {
        date: {
          gte: today,
        },
      },
      orderBy: { date: "asc" }
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();
    const task = await prisma.dailyTask.update({
      where: { id },
      data: { status }
    });
    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tasks } = await request.json();
    
    // Create multiple tasks
    const createdTasks = await Promise.all(tasks.map((task: any) => 
      prisma.dailyTask.create({
        data: {
          taskType: task.taskType,
          date: new Date(task.date)
        }
      })
    ));

    return NextResponse.json(createdTasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
