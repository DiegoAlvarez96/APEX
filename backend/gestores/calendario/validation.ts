import { z } from "zod";

export const calendarSyncSchema = z.object({
  connectionId: z.string().min(1),
  from: z.date(),
  to: z.date()
});
