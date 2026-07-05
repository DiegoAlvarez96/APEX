"use client";

import { db } from "@/lib/db";

const APEX_CLIENT_USER_ID_KEY = "apex.clientUserId";
const SYNC_COLLECTIONS = [
  "completions",
  "products",
  "productConsumptions",
  "alerts",
  "nutritionLogs",
  "workouts",
  "workoutTemplates",
  "bodyMeasurements",
  "shoppingItems",
  "chatMessages",
  "agendaNotes",
  "sleepLogs",
  "sportProfiles",
  "photos",
  "settings"
] as const;

type SyncCollectionName = (typeof SYNC_COLLECTIONS)[number];
type SyncableRecord = { id?: number | string; dateKey?: string; key?: string; updatedAt?: string; createdAt?: string } & Record<string, unknown>;

let syncInFlight: Promise<SyncResult> | null = null;

export type SyncResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
  upserted?: number;
  deleted?: number;
};

export function getClientUserId() {
  const existing = window.localStorage.getItem(APEX_CLIENT_USER_ID_KEY);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(APEX_CLIENT_USER_ID_KEY, next);
  return next;
}

export function startApexAutoSync(options: { intervalMs?: number } = {}) {
  const intervalMs = options.intervalMs ?? 10_000;

  void syncApexSnapshot();
  const intervalId = window.setInterval(() => void syncApexSnapshot(), intervalMs);

  const syncWhenOnline = () => void syncApexSnapshot();
  const syncWhenVisible = () => {
    if (document.visibilityState === "visible") void syncApexSnapshot();
  };

  window.addEventListener("online", syncWhenOnline);
  document.addEventListener("visibilitychange", syncWhenVisible);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener("online", syncWhenOnline);
    document.removeEventListener("visibilitychange", syncWhenVisible);
  };
}

export async function syncApexSnapshot(): Promise<SyncResult> {
  if (typeof window === "undefined") return { ok: false, skipped: true, error: "server_runtime" };
  if (!window.navigator.onLine) return { ok: false, skipped: true, error: "offline" };
  if (syncInFlight) return syncInFlight;

  syncInFlight = pushSnapshot().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

async function pushSnapshot(): Promise<SyncResult> {
  try {
    const userId = getClientUserId();
    const collections = await Promise.all(
      SYNC_COLLECTIONS.map(async (collection) => ({
        collection,
        records: (await readCollection(collection)).map((record) => ({
          localId: getLocalId(collection, record),
          payload: sanitizeRecord(record)
        }))
      }))
    );

    const response = await fetch("/api/sync", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-apex-user-id": userId
      },
      body: JSON.stringify({ collections })
    });

    if (!response.ok) {
      return { ok: false, error: `sync_failed_${response.status}` };
    }

    return (await response.json()) as SyncResult;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function readCollection(collection: SyncCollectionName): Promise<SyncableRecord[]> {
  return (await db[collection].toArray()) as SyncableRecord[];
}

function getLocalId(collection: SyncCollectionName, record: SyncableRecord) {
  if (record.id !== undefined) return String(record.id);
  if (record.dateKey) return record.dateKey;
  if (record.key) return record.key;
  return `${collection}:${record.updatedAt ?? record.createdAt ?? JSON.stringify(record).slice(0, 120)}`;
}

function sanitizeRecord(record: SyncableRecord) {
  return JSON.parse(JSON.stringify(record)) as Record<string, unknown>;
}
