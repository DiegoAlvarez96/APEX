import { z } from "zod";

export const eventCreateSchema = z.object({
  title: z.string().min(1),
  startsAt: z.date(),
  endsAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional()
});
