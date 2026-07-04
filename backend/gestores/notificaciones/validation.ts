import { z } from "zod";
import { ModuleKey, NotificationChannel } from "@/lib/generated/prisma/enums";

export const notificationCreateSchema = z.object({
  moduleKey: z.nativeEnum(ModuleKey).optional(),
  channel: z.nativeEnum(NotificationChannel).optional(),
  title: z.string().min(1),
  body: z.string().optional(),
  scheduledAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional()
});
