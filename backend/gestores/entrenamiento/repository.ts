import { prisma } from "@/lib/server/database/prisma";
import { activeByUser } from "@/lib/server/repositories/baseRepository";
import { toPrismaJson } from "@/lib/server/repositories/json";
import type { WorkoutCreateInput } from "./types";

export const entrenamientoRepository = {
  list(userId: string) {
    return prisma.workout.findMany({ where: activeByUser(userId), orderBy: { scheduledAt: "desc" } });
  },

  create(userId: string, input: WorkoutCreateInput) {
    return prisma.workout.create({ data: { ...input, userId, metadata: toPrismaJson(input.metadata) } });
  }
};
