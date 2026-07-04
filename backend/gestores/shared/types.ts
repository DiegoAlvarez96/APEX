import type { ModuleKey } from "@/lib/generated/prisma/enums";

export type GestorContext = {
  userId: string;
};

export type ModuleScopedGestorContext = GestorContext & {
  moduleKey: ModuleKey;
};

export type UserScopedRecord = {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
};
