import { ModuleKey } from "@/lib/generated/prisma/enums";
import { ForbiddenError } from "@/lib/server/errors";
import { modulesService } from "@/lib/server/services/modulesService";
import { rutinaRepository } from "./repository";
import { routineCreateSchema } from "./validation";
import type { RoutineCreateInput } from "./types";

export const rutinaService = {
  list(userId: string) {
    return rutinaRepository.list(userId);
  },

  async create(userId: string, input: RoutineCreateInput) {
    if (!(await modulesService.isEnabled(userId, ModuleKey.ROUTINE))) throw new ForbiddenError("Modulo rutina desactivado");
    return rutinaRepository.create(userId, routineCreateSchema.parse(input));
  }
};
