import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/rbac";
import { createTaskSchema, taskFiltersSchema } from "@/lib/validations/task";

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const skip = (page - 1) * limit;

    const filters = taskFiltersSchema.parse({
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      assignedTo: searchParams.get("assignedTo") ?? undefined,
    });

    const where = {
      ...(user.role === "VOLUNTEER" && { assignedTo: user.userId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
    };

    const total = await prisma.task.count({ where });

    const rawTasks = await prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
      ],
      include: {
        assignedToUser: {
          select: { id: true, name: true, email: true },
        },
        createdByUser: {
          select: { id: true, name: true },
        },
        submissions: {
          select: {
            id: true,
            submittedAt: true,
            reviewStatus: true,
            fileName: true,
          },
        },
      },
    });

    const tasks = rawTasks.map((task: any) => ({
      ...task,
      dueDate: task.dueDate.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      submissions: task.submissions?.map((submission: any) => ({
        ...submission,
        submittedAt: submission.submittedAt.toISOString(),
      })) || [],
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid filters", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Fetch tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
});

export const POST = withAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const validated = createTaskSchema.parse(body);

      const createdTask = await prisma.task.create({
        data: {
          ...validated,
          createdBy: user.userId,
        },
        include: {
          assignedToUser: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          task: {
            ...createdTask,
            dueDate: createdTask.dueDate.toISOString(),
            createdAt: createdTask.createdAt.toISOString(),
            updatedAt: createdTask.updatedAt.toISOString(),
          },
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 },
        );
      }

      console.error("Create task error:", error);
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
  },
  ["ADMIN"],
);

