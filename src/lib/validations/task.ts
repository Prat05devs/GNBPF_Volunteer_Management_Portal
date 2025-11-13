import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  assignedTo: z.string().cuid(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().refine(
    (val) => {
      // Accept YYYY-MM-DD format or ISO datetime
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(val)) {
        const date = new Date(val);
        return !isNaN(date.getTime());
      }
      // Try parsing as ISO datetime
      const isoDate = new Date(val);
      return !isNaN(isoDate.getTime());
    },
    { message: "Invalid date format" }
  ),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // Optional field
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(val)) {
          const date = new Date(val);
          return !isNaN(date.getTime());
        }
        const isoDate = new Date(val);
        return !isNaN(isoDate.getTime());
      },
      { message: "Invalid date format" }
    )
    .optional(),
});

export const taskFiltersSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assignedTo: z.string().cuid().optional(),
});

