import { ModuleKey } from "@/lib/generated/prisma/enums";
import { ForbiddenError } from "@/lib/server/errors";
import { modulesService } from "@/lib/server/services/modulesService";
import { saludRepository } from "./repository";
import { healthMetricSchema } from "./validation";
import type { HealthMetricInput } from "./types";

export const saludService = {
  list(userId: string) {
    return saludRepository.list(userId);
  },

  async create(userId: string, input: HealthMetricInput) {
    if (!(await modulesService.isEnabled(userId, ModuleKey.HEALTH))) throw new ForbiddenError("Modulo salud desactivado");
    return saludRepository.create(userId, healthMetricSchema.parse(input));
  }
};
