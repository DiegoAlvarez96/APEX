import { z } from "zod";

export const financeTransactionSchema = z.object({
  type: z.string().min(1),
  category: z.string().min(1),
  amount: z.number(),
  currency: z.string().length(3).optional(),
  occurredAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional()
});
