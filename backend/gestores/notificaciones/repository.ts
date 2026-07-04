import { prisma } from "@/lib/server/database/prisma";
import { activeByUser } from "@/lib/server/repositories/baseRepository";
import { toPrismaJson } from "@/lib/server/repositories/json";
import type { NotificationCreateInput } from "./types";

export const notificacionesRepository = {
  list(userId: string) {
    return prisma.notification.findMany({ where: activeByUser(userId), orderBy: { scheduledAt: "asc" } });
  },

  create(userId: string, input: NotificationCreateInput) {
    return prisma.notification.create({ data: { ...input, userId, metadata: toPrismaJson(input.metadata) } });
  }
};
