import type { ModuleKey } from "@/lib/generated/prisma/enums";

export type AiRequestContext = {
  userId: string;
  moduleKey: ModuleKey;
  prompt: string;
  model?: string;
  metadata?: Record<string, unknown>;
};
