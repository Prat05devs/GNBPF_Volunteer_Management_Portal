import { SubmissionsClient } from "@/components/submissions/submissions-client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-server";

export default async function SubmissionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [submissions, tasks] = await Promise.all([
    prisma.submission.findMany({
      where: user.role === "VOLUNTEER" ? { userId: user.id } : {},
      include: {
        task: {
          select: {
            id: true,
            title: true,
            assignedToUser: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: user.role === "VOLUNTEER" ? 25 : 50,
    }),
    user.role === "VOLUNTEER"
      ? prisma.task.findMany({
          where: { assignedTo: user.id },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <SubmissionsClient
      currentUser={user}
      tasks={tasks}
      initialSubmissions={submissions.map((submission) => ({
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
      }))}
    />
  );
}

