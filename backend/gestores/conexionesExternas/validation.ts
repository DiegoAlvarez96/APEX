import { z } from "zod";
import { ExternalProvider } from "@/lib/generated/prisma/enums";

export const externalConnectionSchema = z.object({
  provider: z.nativeEnum(ExternalProvider),
  externalUserId: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.date().optional(),
  scopes: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional()
});
