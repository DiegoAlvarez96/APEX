import { ModuleKey } from "@/lib/generated/prisma/enums";
import { ForbiddenError } from "@/lib/server/errors";
import { calendarService } from "@/lib/server/services/calendarService";
import { modulesService } from "@/lib/server/services/modulesService";
import { eventCreateSchema } from "./validation";
import type { EventCreateInput } from "./types";

export const eventosService = {
  list(userId: string, from: Date, to: Date) {
    return calendarService.listInternalEvents(userId, from, to);
  },

  async create(userId: string, input: EventCreateInput) {
    if (!(await modulesService.isEnabled(userId, ModuleKey.EVENTS))) throw new ForbiddenError("Modulo eventos desactivado");
    return calendarService.createInternalEvent({ userId, ...eventCreateSchema.parse(input) });
  }
};
