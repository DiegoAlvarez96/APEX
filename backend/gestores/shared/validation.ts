import { z } from "zod";

export const userIdSchema = z.string().min(1);

export const gestorContextSchema = z.object({
  userId: userIdSchema
});

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional()
});
