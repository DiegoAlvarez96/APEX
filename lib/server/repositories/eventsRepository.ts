import { prisma } from "@/lib/server/database/prisma";
import { activeByUser } from "@/lib/server/repositories/baseRepository";
import { toPrismaJson } from "@/lib/server/repositories/json";

export const eventsRepository = {
  listByRange(userId: string, from: Date, to: Date) {
    return prisma.event.findMany({
      where: {
        ...activeByUser(userId),
        startsAt: { gte: from, lte: to }
      },
      orderBy: { startsAt: "asc" }
    });
  },

  create(input: { userId: string; title: string; startsAt: Date; endsAt?: Date; source?: string; externalId?: string; metadata?: Record<string, unknown> }) {
    return prisma.event.create({ data: { ...input, metadata: toPrismaJson(input.metadata) } });
  },

  update(input: { userId: string; id: string; title?: string; startsAt?: Date; endsAt?: Date; metadata?: Record<string, unknown> }) {
    return prisma.event.update({
      where: { id: input.id, userId: input.userId },
      data: {
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        metadata: toPrismaJson(input.metadata)
      }
    });
  },

  softDelete(userId: string, id: string) {
    return prisma.event.update({
      where: { id, userId },
      data: { isDeleted: true }
    });
  }
};
