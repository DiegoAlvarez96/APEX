import type { AiLogStatus, ModuleKey } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/server/database/prisma";
import { toPrismaJson } from "@/lib/server/repositories/json";

export const aiLogsRepository = {
  create(input: {
    userId: string;
    moduleKey?: ModuleKey;
    status: AiLogStatus;
    model: string;
    prompt?: string;
    response?: string;
    error?: string;
    tokens?: number;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.aiLog.create({ data: { ...input, metadata: toPrismaJson(input.metadata) } });
  }
};
