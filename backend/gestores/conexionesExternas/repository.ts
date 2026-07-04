import { ConnectionStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/server/database/prisma";
import { activeByUser } from "@/lib/server/repositories/baseRepository";
import { toPrismaJson } from "@/lib/server/repositories/json";
import type { ExternalConnectionInput } from "./types";

export const conexionesExternasRepository = {
  list(userId: string) {
    return prisma.externalConnection.findMany({ where: activeByUser(userId), orderBy: { updatedAt: "desc" } });
  },

  upsert(userId: string, input: ExternalConnectionInput) {
    return prisma.externalConnection.upsert({
      where: { userId_provider: { userId, provider: input.provider } },
      create: { ...input, userId, status: ConnectionStatus.ACTIVE, scopes: input.scopes ?? [], metadata: toPrismaJson(input.metadata) },
      update: { ...input, status: ConnectionStatus.ACTIVE, isDeleted: false, metadata: toPrismaJson(input.metadata) }
    });
  }
};
