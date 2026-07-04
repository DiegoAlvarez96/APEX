import { ModuleKey } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/server/database/prisma";
import { activeByUser } from "@/lib/server/repositories/baseRepository";

export const modulesRepository = {
  listForUser(userId: string) {
    return prisma.userModule.findMany({
      where: activeByUser(userId),
      include: { module: true },
      orderBy: { module: { sortOrder: "asc" } }
    });
  },

  findUserModule(userId: string, key: ModuleKey) {
    return prisma.userModule.findFirst({
      where: {
        userId,
        isDeleted: false,
        module: { key, isDeleted: false }
      },
      include: { module: true }
    });
  },

  async ensureModuleForUser(input: { userId: string; key: ModuleKey; name: string; description?: string; sortOrder?: number }) {
    const moduleRecord = await prisma.module.upsert({
      where: {
        userId_key: {
          userId: input.userId,
          key: input.key
        }
      },
      create: {
        userId: input.userId,
        key: input.key,
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder ?? 0
      },
      update: {
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder ?? 0,
        isDeleted: false
      }
    });

    return prisma.userModule.upsert({
      where: {
        userId_moduleId: {
          userId: input.userId,
          moduleId: moduleRecord.id
        }
      },
      create: {
        userId: input.userId,
        moduleId: moduleRecord.id
      },
      update: {
        isDeleted: false
      },
      include: { module: true }
    });
  },

  setEnabled(input: { userId: string; moduleId: string; enabled: boolean }) {
    return prisma.userModule.update({
      where: {
        userId_moduleId: {
          userId: input.userId,
          moduleId: input.moduleId
        }
      },
      data: { enabled: input.enabled },
      include: { module: true }
    });
  }
};
