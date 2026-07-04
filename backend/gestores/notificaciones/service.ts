import { ForbiddenError } from "@/lib/server/errors";
import { notificationService } from "@/lib/server/services/notificationService";
import { notificacionesRepository } from "./repository";
import { notificationCreateSchema } from "./validation";
import type { NotificationCreateInput } from "./types";

export const notificacionesService = {
  list(userId: string) {
    return notificacionesRepository.list(userId);
  },

  async create(userId: string, input: NotificationCreateInput) {
    const data = notificationCreateSchema.parse(input);
    if (data.moduleKey && !(await notificationService.canNotify(userId, data.moduleKey))) {
      throw new ForbiddenError("El modulo esta desactivado y no puede generar notificaciones");
    }
    return notificacionesRepository.create(userId, data);
  }
};
