import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/rbac";
import { updateTaskSchema } from "@/lib/validations/task";

export const GET = withAuth(async (_request, user, context) => {
  const { id } = context?.params || {};
  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignedToUser: {
        select: { id: true, name: true, email: true },
      },
      createdByUser: {
        select: { id: true, name: true },
      },
      submissions: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (user.role === "VOLUNTEER" && task.assignedTo !== user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    task: {
      ...task,
      dueDate: task.dueDate.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      submissions: task.submissions.map((submission) => ({
        ...submission,
        submittedAt: submission.submittedAt.toISOString(),
        reviewedAt: submission.reviewedAt ? submission.reviewedAt.toISOString() : null,
      })),
    },
  });
});

export const PATCH = withAuth(async (request, user, context) => {
  try {
    const { id } = context?.params || {};
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }
    
    const body = await request.json();
    const validated = updateTaskSchema.parse(body);

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (user.role === "VOLUNTEER") {
      if (existingTask.assignedTo !== user.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (Object.keys(validated).some((key) => key !== "status")) {
        return NextResponse.json({ error: "Volunteers can only update task status" }, { status: 403 });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: validated,
      include: {
        assignedToUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      task: {
        ...task,
        dueDate: task.dueDate.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Update task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
});

export const DELETE = withAuth(
  async (_request, _user, context) => {
    const { id } = context?.params || {};
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  },
  ["ADMIN"],
);

