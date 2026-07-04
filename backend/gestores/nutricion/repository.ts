import { prisma } from "@/lib/server/database/prisma";
import { activeByUser } from "@/lib/server/repositories/baseRepository";
import { toPrismaJson } from "@/lib/server/repositories/json";
import type { NutritionCreateInput } from "./types";

export const nutricionRepository = {
  list(userId: string) {
    return prisma.nutritionLog.findMany({ where: activeByUser(userId), orderBy: { loggedAt: "desc" } });
  },

  create(userId: string, input: NutritionCreateInput) {
    return prisma.nutritionLog.create({ data: { ...input, userId, metadata: toPrismaJson(input.metadata) } });
  }
};
