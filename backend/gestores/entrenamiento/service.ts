import { ModuleKey } from "@/lib/generated/prisma/enums";
import { ForbiddenError } from "@/lib/server/errors";
import { modulesService } from "@/lib/server/services/modulesService";
import { entrenamientoRepository } from "./repository";
import { workoutCreateSchema } from "./validation";
import type { WorkoutCreateInput } from "./types";

export const entrenamientoService = {
  list(userId: string) {
    return entrenamientoRepository.list(userId);
  },

  async create(userId: string, input: WorkoutCreateInput) {
    if (!(await modulesService.isEnabled(userId, ModuleKey.TRAINING))) throw new ForbiddenError("Modulo entrenamiento desactivado");
    return entrenamientoRepository.create(userId, workoutCreateSchema.parse(input));
  }
};
