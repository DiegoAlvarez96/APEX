import { ModuleKey } from "@/lib/generated/prisma/enums";
import { modulesRepository } from "@/lib/server/repositories/modulesRepository";

const defaultModules: Array<{ key: ModuleKey; name: string; description: string; sortOrder: number }> = [
  { key: ModuleKey.HOME, name: "Home", description: "Resumen principal", sortOrder: 10 },
  { key: ModuleKey.NUTRITION, name: "Nutricion", description: "Comidas, macros y objetivos", sortOrder: 20 },
  { key: ModuleKey.TRAINING, name: "Entrenamiento", description: "Rutinas y progreso", sortOrder: 30 },
  { key: ModuleKey.ROUTINE, name: "Rutina", description: "Habitos, skincare y tareas", sortOrder: 40 },
  { key: ModuleKey.EVENTS, name: "Eventos", description: "Agenda interna y sincronizaciones", sortOrder: 50 },
  { key: ModuleKey.FINANCE, name: "Finanzas", description: "Gastos, presupuestos y vencimientos", sortOrder: 60 },
  { key: ModuleKey.HEALTH, name: "Salud", description: "Metricas de salud y wearables", sortOrder: 70 },
  { key: ModuleKey.AI, name: "IA", description: "Asistencia y automatizaciones", sortOrder: 80 },
  { key: ModuleKey.INTEGRATIONS, name: "Integraciones", description: "Conexiones externas", sortOrder: 90 },
  { key: ModuleKey.NOTIFICATIONS, name: "Notificaciones", description: "Recordatorios y alertas", sortOrder: 100 }
];

export const modulesService = {
  async ensureDefaults(userId: string) {
    return Promise.all(defaultModules.map((module) => modulesRepository.ensureModuleForUser({ userId, ...module })));
  },

  listForUser(userId: string) {
    return modulesRepository.listForUser(userId);
  },

  async isEnabled(userId: string, key: ModuleKey) {
    const userModule = await modulesRepository.findUserModule(userId, key);
    return Boolean(userModule?.enabled && !userModule.module.isDeleted);
  }
};
