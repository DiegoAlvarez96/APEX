import { z } from "zod";

export const registerUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  passwordHash: z.string().min(12).optional(),
  displayName: z.string().min(1).max(120).optional()
});
