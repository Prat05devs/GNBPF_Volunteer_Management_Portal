import { TasksClient } from "@/components/tasks/tasks-client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-server";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
      where: user.role === "VOLUNTEER" ? { assignedTo: user.id } : {},
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 25,
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
            reviewStatus: true,
            submittedAt: true,
          },
        },
      },
    }),
    user.role === "ADMIN"
      ? prisma.user.findMany({
          where: { role: "VOLUNTEER" },
          orderBy: { name: "asc" },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <TasksClient
      currentUser={user}
      initialTasks={tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate.toISOString(),
        assignedTo: {
          id: task.assignedToUser?.id || task.assignedTo,
          name: task.assignedToUser?.name || "Unknown",
          email: task.assignedToUser?.email || "",
        },
        createdBy: {
          id: task.createdByUser?.id || task.createdBy,
          name: task.createdByUser?.name || "Unknown",
        },
        submissionCount: task.submissions?.length || 0,
      }))}
      volunteers={users}
    />
  );
}
