import { ModuleKey } from "@/lib/generated/prisma/enums";
import { modulesService } from "@/lib/server/services/modulesService";

export const notificationService = {
  async canNotify(userId: string, moduleKey: ModuleKey) {
    return modulesService.isEnabled(userId, moduleKey);
  }
};
