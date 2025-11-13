"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import Link from "next/link";
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
import { reviewSubmissionSchema } from "@/lib/validations/submission";

const submissionFormSchema = z.object({
  taskId: z.string().cuid("Select a valid task"),
  content: z.string().max(2000).optional(),
  file: z
    .any()
    .refine((file) => file instanceof File || file === undefined, "Invalid file upload")
    .optional(),
});

type SubmissionFormValues = z.infer<typeof submissionFormSchema>;
type ReviewSubmissionValues = z.infer<typeof reviewSubmissionSchema>;

interface SubmissionItem {
  id: string;
  task: {
    id: string;
    title: string;
    assignedTo?: { id: string; name: string };
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVISION";
  reviewNotes: string | null;
  submittedAt: string;
}

interface SubmissionsClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "VOLUNTEER";
  };
  tasks: Array<{ id: string; title: string }>;
  initialSubmissions: SubmissionItem[];
}

export function SubmissionsClient({ currentUser, tasks, initialSubmissions }: SubmissionsClientProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SubmissionItem["reviewStatus"] | "ALL">("ALL");

  const submissionForm = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      taskId: tasks[0]?.id,
      content: "",
    },
  });

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => filterStatus === "ALL" || submission.reviewStatus === filterStatus);
  }, [submissions, filterStatus]);

  const refreshSubmissions = async () => {
    const res = await fetch("/api/submissions/list");
    if (!res.ok) {
      return;
    }
    const data = await res.json();
    setSubmissions(
      data.submissions.map((submission: any) => ({
        id: submission.id,
        task: submission.task,
        user: submission.user,
        content: submission.content,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        fileSize: submission.fileSize,
        reviewStatus: submission.reviewStatus,
        reviewNotes: submission.reviewNotes,
        submittedAt: submission.submittedAt,
      })),
    );
  };

  const onSubmitWork = (values: SubmissionFormValues) => {
    startTransition(async () => {
      setMessage(null);
      const formData = new FormData();
      formData.set("taskId", values.taskId);
      if (values.content) {
        formData.set("content", values.content);
      }
      if (values.file instanceof File) {
        formData.set("file", values.file);
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Failed to submit work");
        return;
      }

      submissionForm.reset({ taskId: tasks[0]?.id ?? "", content: "" });
      await refreshSubmissions();
      setMessage("Submission uploaded successfully.");
    });
  };

  const onReviewSubmission = (submissionId: string, values: ReviewSubmissionValues) => {
    startTransition(async () => {
      setMessage(null);
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? "Failed to update submission review");
        return;
      }

      await refreshSubmissions();
      setMessage("Submission review updated.");
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Upload your work for review and track feedback from the admin team.
        </p>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {currentUser.role === "VOLUNTEER" && (
        <Card>
          <CardHeader>
            <CardTitle>Submit work</CardTitle>
            <CardDescription>Attach files or notes for the tasks you&apos;re working on.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...submissionForm}>
              <form onSubmit={submissionForm.handleSubmit(onSubmitWork)} className="space-y-4">
                <FormField
                  control={submissionForm.control}
                  name="taskId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a task" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={submissionForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add context or a summary of your work" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={submissionForm.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attach file (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                          onChange={(event) => field.onChange(event.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={pending}>
                  {pending ? "Submitting..." : "Submit work"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as SubmissionItem["reviewStatus"] | "ALL")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by review status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="NEEDS_REVISION">Needs revision</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={() => refreshSubmissions()} disabled={pending}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currentUser.role === "ADMIN" ? "All submissions" : "Your submissions"}</CardTitle>
          <CardDescription>Review the work submitted and track feedback history.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted At</TableHead>
                {currentUser.role === "ADMIN" && <TableHead>Review</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={currentUser.role === "ADMIN" ? 7 : 6} className="text-center text-sm text-muted-foreground">
                    No submissions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.task.title}</TableCell>
                    <TableCell>
                      <div>{submission.user.name}</div>
                      <div className="text-xs text-muted-foreground">{submission.user.email}</div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {submission.content ?? "—"}
                    </TableCell>
                    <TableCell>
                      {submission.fileUrl ? (
                        <Link href={submission.fileUrl} className="text-sm text-primary hover:underline" target="_blank">
                          {submission.fileName ?? "Download file"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={submission.reviewStatus === "APPROVED" ? "secondary" : "outline"}>
                        {submission.reviewStatus.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(submission.submittedAt), "MMM d, yyyy")}</TableCell>
                    {currentUser.role === "ADMIN" && (
                      <TableCell>
                        <AdminReviewForm submission={submission} onReview={onReviewSubmission} disabled={pending} />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

interface AdminReviewFormProps {
  submission: SubmissionItem;
  disabled: boolean;
  onReview: (submissionId: string, values: ReviewSubmissionValues) => void;
}

function AdminReviewForm({ submission, disabled, onReview }: AdminReviewFormProps) {
  const form = useForm<ReviewSubmissionValues>({
    resolver: zodResolver(reviewSubmissionSchema),
    defaultValues: {
      reviewStatus: submission.reviewStatus,
      reviewNotes: submission.reviewNotes ?? "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onReview(submission.id, values))}
        className="flex flex-col gap-2"
      >
        <Select onValueChange={(value) => form.setValue("reviewStatus", value as ReviewSubmissionValues["reviewStatus"])} value={form.watch("reviewStatus")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="NEEDS_REVISION">Needs revision</SelectItem>
          </SelectContent>
        </Select>
        <Textarea
          rows={2}
          placeholder="Review notes"
          value={form.watch("reviewNotes") ?? ""}
          onChange={(event) => form.setValue("reviewNotes", event.target.value)}
        />
        <Button type="submit" size="sm" disabled={disabled}>
          Update
        </Button>
      </form>
    </Form>
  );
}

