import { ModuleKey } from "@/lib/generated/prisma/enums";
import { ForbiddenError } from "@/lib/server/errors";
import { modulesService } from "@/lib/server/services/modulesService";
import { finanzasRepository } from "./repository";
import { financeTransactionSchema } from "./validation";
import type { FinanceTransactionInput } from "./types";

export const finanzasService = {
  list(userId: string) {
    return finanzasRepository.list(userId);
  },

  async create(userId: string, input: FinanceTransactionInput) {
    if (!(await modulesService.isEnabled(userId, ModuleKey.FINANCE))) throw new ForbiddenError("Modulo finanzas desactivado");
    return finanzasRepository.create(userId, financeTransactionSchema.parse(input));
  }
};
