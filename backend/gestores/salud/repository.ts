import { prisma } from "@/lib/server/database/prisma";
import { activeByUser } from "@/lib/server/repositories/baseRepository";
import { toPrismaJson } from "@/lib/server/repositories/json";
import type { HealthMetricInput } from "./types";

export const saludRepository = {
  list(userId: string) {
    return prisma.healthMetric.findMany({ where: activeByUser(userId), orderBy: { measuredAt: "desc" } });
  },

  create(userId: string, input: HealthMetricInput) {
    return prisma.healthMetric.create({ data: { ...input, userId, metadata: toPrismaJson(input.metadata) } });
  }
};
