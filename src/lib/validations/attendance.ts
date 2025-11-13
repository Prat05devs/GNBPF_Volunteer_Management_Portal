import { z } from "zod";

export const checkInSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().max(500).optional(),
});

