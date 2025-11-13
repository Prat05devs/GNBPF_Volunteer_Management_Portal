"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createTaskSchema } from "@/lib/validations/task";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface TaskSummary {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  submissionCount: number;
}

interface TasksClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "VOLUNTEER";
  };
  initialTasks: TaskSummary[];
  volunteers: Array<{ id: string; name: string; email: string }>;
}

const createTaskFormSchema = createTaskSchema.extend({
  description: z.string().min(10).max(5000),
});

type CreateTaskValues = z.infer<typeof createTaskFormSchema>;

export function TasksClient({ currentUser, initialTasks, volunteers }: TasksClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "ALL">("ALL");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "ALL">("ALL");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatches = filterStatus === "ALL" || task.status === filterStatus;
      const priorityMatches = filterPriority === "ALL" || task.priority === filterPriority;
      return statusMatches && priorityMatches;
    });
  }, [tasks, filterStatus, filterPriority]);

  const form = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      assignedTo: volunteers[0]?.id ?? "",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    },
  });

  const refreshTasks = async () => {
    const res = await fetch("/api/tasks");
    if (!res.ok) {
      return;
    }
    const data = await res.json();
    setTasks(
      data.data.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignedTo: task.assignedToUser,
        createdBy: task.createdByUser,
        submissionCount: task.submissions.length,
      })),
    );
  };

  const handleStatusChange = (task: TaskSummary, nextStatus: TaskStatus) => {
    startTransition(async () => {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Failed to update task");
        return;
      }

      refreshTasks();
      setMessage("Task updated successfully.");
    });
  };

  const handleDelete = (taskId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Failed to delete task");
        return;
      }
      refreshTasks();
      setMessage("Task deleted.");
    });
  };

  const onCreateTask = (values: CreateTaskValues) => {
    startTransition(async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          dueDate: new Date(values.dueDate).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Failed to create task");
        return;
      }

      form.reset();
      refreshTasks();
      setMessage("Task created.");
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-muted-foreground">View and manage tasks assigned to you.</p>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="flex flex-wrap gap-3">
        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as TaskStatus | "ALL")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterPriority}
          onValueChange={(value) => setFilterPriority(value as TaskPriority | "ALL")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={() => refreshTasks()} disabled={pending}>
          Refresh
        </Button>
      </div>

      {currentUser.role === "ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle>Assign a new task</CardTitle>
            <CardDescription>Admins can assign tasks to volunteers from here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onCreateTask)} className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Create onboarding design assets" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Provide details about the task" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select volunteer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {volunteers.map((volunteer) => (
                            <SelectItem key={volunteer.id} value={volunteer.id}>
                              {volunteer.name} ({volunteer.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="LOW">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={pending}>
                    {pending ? "Saving..." : "Create task"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Task list</CardTitle>
          <CardDescription>All tasks assigned to you are listed here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No tasks match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => {
                  const allStatuses: TaskStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED"];
                  const nextStatuses: TaskStatus[] =
                    currentUser.role === "ADMIN"
                      ? allStatuses
                      : allStatuses.filter((status) => status !== task.status);

                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="font-medium">{task.title}</div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      </TableCell>
                      <TableCell>{format(new Date(task.dueDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={task.priority === "HIGH" ? "destructive" : "secondary"}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.status.replace("_", " ")}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{task.assignedTo.name}</div>
                        <div className="text-xs text-muted-foreground">{task.assignedTo.email}</div>
                      </TableCell>
                      <TableCell>{task.submissionCount}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {nextStatuses.map((statusOption) => (
                            <Button
                              key={statusOption}
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => handleStatusChange(task, statusOption)}
                            >
                              Set {statusOption.replace("_", " ")}
                            </Button>
                          ))}
                          {currentUser.role === "ADMIN" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              disabled={pending}
                              onClick={() => handleDelete(task.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

