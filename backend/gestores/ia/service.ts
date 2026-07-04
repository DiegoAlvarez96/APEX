import { AiLogStatus } from "@/lib/generated/prisma/enums";
import { env } from "@/lib/server/config/env";
import { ForbiddenError } from "@/lib/server/errors";
import { modulesService } from "@/lib/server/services/modulesService";
import { iaRepository } from "./repository";
import { aiRequestContextSchema } from "./validation";
import type { AiRequestContext } from "./types";

export const iaService = {
  async assertCanUseAi(input: AiRequestContext) {
    const data = aiRequestContextSchema.parse(input);
    const moduleEnabled = await modulesService.isEnabled(data.userId, data.moduleKey);
    if (!moduleEnabled) throw new ForbiddenError("El modulo esta desactivado y no puede consumir IA");
    return { ...data, model: data.model ?? env.OPENAI_DEFAULT_MODEL };
  },

  logSuccess(input: AiRequestContext & { response?: string; tokens?: number }) {
    return iaRepository.create({
      userId: input.userId,
      moduleKey: input.moduleKey,
      status: AiLogStatus.SUCCESS,
      model: input.model ?? env.OPENAI_DEFAULT_MODEL,
      prompt: input.prompt,
      response: input.response,
      tokens: input.tokens,
      metadata: input.metadata
    });
  },

  logError(input: AiRequestContext & { error: string }) {
    return iaRepository.create({
      userId: input.userId,
      moduleKey: input.moduleKey,
      status: AiLogStatus.ERROR,
      model: input.model ?? env.OPENAI_DEFAULT_MODEL,
      prompt: input.prompt,
      error: input.error,
      metadata: input.metadata
    });
  }
};
