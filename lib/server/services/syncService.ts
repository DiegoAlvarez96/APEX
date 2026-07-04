import { z } from "zod";
import { syncRepository } from "@/lib/server/repositories/syncRepository";

const syncRecordSchema = z.object({
  localId: z.string().min(1),
  payload: z.record(z.unknown())
});

const syncCollectionSchema = z.object({
  collection: z.string().min(1),
  records: z.array(syncRecordSchema)
});

export const syncSnapshotSchema = z.object({
  userId: z.string().min(1),
  collections: z.array(syncCollectionSchema)
});

export const syncService = {
  applySnapshot(input: unknown) {
    const snapshot = syncSnapshotSchema.parse(input);
    return syncRepository.applySnapshot(snapshot.userId, snapshot.collections);
  }
};
