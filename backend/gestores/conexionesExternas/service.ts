import { ModuleKey } from "@/lib/generated/prisma/enums";
import { ForbiddenError } from "@/lib/server/errors";
import { modulesService } from "@/lib/server/services/modulesService";
import { conexionesExternasRepository } from "./repository";
import { externalConnectionSchema } from "./validation";
import type { ExternalConnectionInput } from "./types";

export const conexionesExternasService = {
  list(userId: string) {
    return conexionesExternasRepository.list(userId);
  },

  async connect(userId: string, input: ExternalConnectionInput) {
    if (!(await modulesService.isEnabled(userId, ModuleKey.INTEGRATIONS))) throw new ForbiddenError("Modulo integraciones desactivado");
    return conexionesExternasRepository.upsert(userId, externalConnectionSchema.parse(input));
  }
};
