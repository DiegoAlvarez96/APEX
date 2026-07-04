import { z } from "zod";

export const routineCreateSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  metadata: z.record(z.unknown()).optional()
});
