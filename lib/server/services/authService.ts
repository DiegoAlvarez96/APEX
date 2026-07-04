import { getConfiguredAuthProviders } from "@/lib/server/config/env";
import { UnauthorizedError } from "@/lib/server/errors";
import { authRepository } from "@/lib/server/repositories/authRepository";

export type ApexSession = {
  user: {
    id: string;
    email?: string | null;
    role?: string;
  };
};

export const authService = {
  providers: getConfiguredAuthProviders(),

  async getCurrentSession(): Promise<ApexSession | null> {
    // Adapter point for Auth.js, custom JWT, or future Render-hosted auth middleware.
    return null;
  },

  async requireUserId(session?: ApexSession | null) {
    const current = session ?? (await this.getCurrentSession());
    if (!current?.user.id) throw new UnauthorizedError();
    return current.user.id;
  },

  findUserById(userId: string) {
    return authRepository.findUserById(userId);
  }
};
