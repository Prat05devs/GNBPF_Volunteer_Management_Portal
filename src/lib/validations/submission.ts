import { z } from "zod";

export const reviewSubmissionSchema = z.object({
  reviewStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "NEEDS_REVISION"]),
  reviewNotes: z.string().max(2000).optional(),
});

export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;

