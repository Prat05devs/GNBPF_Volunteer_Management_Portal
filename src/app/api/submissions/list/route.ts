import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/rbac";

export const GET = withAuth(async (_request, user) => {
  const submissions = await prisma.submission.findMany({
    where: user.role === "VOLUNTEER" ? { userId: user.userId } : {},
    include: {
      task: {
        select: {
          id: true,
          title: true,
          assignedToUser: {
            select: { id: true, name: true },
          },
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({
    submissions: submissions.map((submission) => ({
      id: submission.id,
      task: {
        id: submission.task.id,
        title: submission.task.title,
        assignedTo: submission.task.assignedToUser
          ? {
              id: submission.task.assignedToUser.id,
              name: submission.task.assignedToUser.name,
            }
          : undefined,
      },
      user: submission.user,
      content: submission.content,
      fileUrl: submission.fileUrl,
      fileName: submission.fileName,
      fileSize: submission.fileSize,
      reviewStatus: submission.reviewStatus,
      reviewNotes: submission.reviewNotes,
      submittedAt: submission.submittedAt.toISOString(),
    })),
  });
});

