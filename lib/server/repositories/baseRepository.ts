export type UserScopedQuery = {
  userId: string;
};

export type SoftDeleteFields = {
  isDeleted: boolean;
};

export function activeByUser(userId: string): UserScopedQuery & SoftDeleteFields {
  return {
    userId,
    isDeleted: false
  };
}
