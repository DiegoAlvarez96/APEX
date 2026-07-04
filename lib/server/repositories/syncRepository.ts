import { prisma } from "@/lib/server/database/prisma";
import { toPrismaJson } from "@/lib/server/repositories/json";

export type SyncSnapshotCollection = {
  collection: string;
  records: Array<{
    localId: string;
    payload: Record<string, unknown>;
  }>;
};

export const syncRepository = {
  async ensureClientUser(userId: string) {
    return prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        role: "USER",
        profile: {
          create: {
            displayName: "APEX local user"
          }
        }
      },
      update: {
        isDeleted: false
      }
    });
  },

  async applySnapshot(userId: string, collections: SyncSnapshotCollection[]) {
    await this.ensureClientUser(userId);
    const syncedAt = new Date();

    return prisma.$transaction(async (tx) => {
      let upserted = 0;
      let deleted = 0;

      for (const collection of collections) {
        const activeLocalIds = collection.records.map((record) => record.localId);

        for (const record of collection.records) {
          await tx.clientSyncRecord.upsert({
            where: {
              userId_collection_localId: {
                userId,
                collection: collection.collection,
                localId: record.localId
              }
            },
            create: {
              userId,
              collection: collection.collection,
              localId: record.localId,
              operation: "upsert",
              payload: toPrismaJson(record.payload) ?? {},
              syncedAt
            },
            update: {
              operation: "upsert",
              payload: toPrismaJson(record.payload) ?? {},
              syncedAt,
              isDeleted: false
            }
          });
          upserted += 1;
        }

        const result = await tx.clientSyncRecord.updateMany({
          where: {
            userId,
            collection: collection.collection,
            isDeleted: false,
            localId: activeLocalIds.length ? { notIn: activeLocalIds } : undefined
          },
          data: {
            operation: "delete",
            syncedAt,
            isDeleted: true
          }
        });
        deleted += result.count;
      }

      return { upserted, deleted, syncedAt };
    });
  }
};
