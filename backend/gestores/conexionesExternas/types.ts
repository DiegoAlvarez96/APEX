import type { ExternalProvider } from "@/lib/generated/prisma/enums";

export type ExternalConnectionInput = {
  provider: ExternalProvider;
  externalUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
  metadata?: Record<string, unknown>;
};
