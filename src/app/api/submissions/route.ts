import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/rbac";
import { uploadSubmissionFile } from "@/lib/uploads";

export const POST = withAuth(async (request, user) => {
  try {
    const formData = await request.formData();
    const taskId = formData.get("taskId") as string | null;
    const content = (formData.get("content") as string | null) ?? undefined;
    const file = formData.get("file") as File | null;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (user.role === "VOLUNTEER" && task.assignedTo !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;

    if (file) {
      const uploaded = await uploadSubmissionFile(file);
      fileUrl = uploaded.url;
      fileName = uploaded.name;
      fileSize = uploaded.size;
    }

    const submission = await prisma.submission.create({
      data: {
        taskId,
        userId: user.userId,
        content,
        fileUrl,
        fileName,
        fileSize,
      },
    });

    return NextResponse.json(
      {
        success: true,
        submission: {
          ...submission,
          submittedAt: submission.submittedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
});

