import { prisma } from "@/lib/server/database/prisma";
import { activeByUser } from "@/lib/server/repositories/baseRepository";
import { toPrismaJson } from "@/lib/server/repositories/json";
import type { FinanceTransactionInput } from "./types";

export const finanzasRepository = {
  list(userId: string) {
    return prisma.financeTransaction.findMany({ where: activeByUser(userId), orderBy: { occurredAt: "desc" } });
  },

  create(userId: string, input: FinanceTransactionInput) {
    return prisma.financeTransaction.create({ data: { ...input, userId, metadata: toPrismaJson(input.metadata) } });
  }
};
