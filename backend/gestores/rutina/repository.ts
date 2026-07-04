import { prisma } from "@/lib/server/database/prisma";
import { activeByUser } from "@/lib/server/repositories/baseRepository";
import { toPrismaJson } from "@/lib/server/repositories/json";
import type { RoutineCreateInput } from "./types";

export const rutinaRepository = {
  list(userId: string) {
    return prisma.routine.findMany({ where: activeByUser(userId), orderBy: { createdAt: "desc" } });
  },

  create(userId: string, input: RoutineCreateInput) {
    return prisma.routine.create({ data: { ...input, userId, metadata: toPrismaJson(input.metadata) } });
  }
};
