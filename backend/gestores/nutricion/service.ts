import { ModuleKey } from "@/lib/generated/prisma/enums";
import { ForbiddenError } from "@/lib/server/errors";
import { modulesService } from "@/lib/server/services/modulesService";
import { nutricionRepository } from "./repository";
import { nutritionCreateSchema } from "./validation";
import type { NutritionCreateInput } from "./types";

export const nutricionService = {
  list(userId: string) {
    return nutricionRepository.list(userId);
  },

  async create(userId: string, input: NutritionCreateInput) {
    if (!(await modulesService.isEnabled(userId, ModuleKey.NUTRITION))) throw new ForbiddenError("Modulo nutricion desactivado");
    return nutricionRepository.create(userId, nutritionCreateSchema.parse(input));
  }
};
