import { z } from "zod";

export const workoutCreateSchema = z.object({
  title: z.string().min(1),
  focus: z.string().optional(),
  scheduledAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional()
});
