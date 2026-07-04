import type { ModuleKey, NotificationChannel } from "@/lib/generated/prisma/enums";

export type NotificationCreateInput = {
  moduleKey?: ModuleKey;
  channel?: NotificationChannel;
  title: string;
  body?: string;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
};
