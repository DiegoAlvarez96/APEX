import { prisma } from "@/lib/server/database/prisma";
import type { AuthProvider, UserRole } from "@/lib/generated/prisma/enums";

export type CreateUserInput = {
  email?: string;
  phone?: string;
  passwordHash?: string;
  role?: UserRole;
  displayName?: string;
};

export const authRepository = {
  findUserById(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
      include: { profile: true, authAccounts: true }
    });
  },

  findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, isDeleted: false },
      include: { profile: true, authAccounts: true }
    });
  },

  createUser(input: CreateUserInput) {
    return prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash: input.passwordHash,
        role: input.role,
        profile: {
          create: {
            displayName: input.displayName
          }
        }
      },
      include: { profile: true }
    });
  },

  linkAuthAccount(input: {
    userId: string;
    provider: AuthProvider;
    providerAccountId: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope?: string;
    tokenType?: string;
  }) {
    return prisma.authAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: input.provider,
          providerAccountId: input.providerAccountId
        }
      },
      create: input,
      update: {
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        expiresAt: input.expiresAt,
        scope: input.scope,
        tokenType: input.tokenType,
        isDeleted: false
      }
    });
  }
};
