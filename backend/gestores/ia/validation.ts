import { z } from "zod";
import { ModuleKey } from "@/lib/generated/prisma/enums";

export const aiRequestContextSchema = z.object({
  userId: z.string().min(1),
  moduleKey: z.nativeEnum(ModuleKey),
  prompt: z.string().min(1),
  model: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});
