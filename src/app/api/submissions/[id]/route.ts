import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/rbac";
import { reviewSubmissionSchema } from "@/lib/validations/submission";

export const PATCH = withAuth(
  async (request, _user, { params }) => {
    try {
      const { id } = params;
      const body = await request.json();
      const validated = reviewSubmissionSchema.parse(body);

      const submission = await prisma.submission.findUnique({
        where: { id },
      });

      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }

      const updated = await prisma.submission.update({
        where: { id },
        data: {
          reviewStatus: validated.reviewStatus,
          reviewNotes: validated.reviewNotes,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        submission: {
          ...updated,
          submittedAt: updated.submittedAt.toISOString(),
          reviewedAt: updated.reviewedAt ? updated.reviewedAt.toISOString() : null,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 },
        );
      }

      console.error("Review submission error:", error);
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
    }
  },
  ["ADMIN"],
);

