import type { Prisma } from "@/lib/generated/prisma/client";

export function toPrismaJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  return value as Prisma.InputJsonValue | undefined;
}
