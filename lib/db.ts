"use client";

import Dexie, { type Table } from "dexie";
import type { AppSettings, Product, ProgressPhoto, TaskCompletion } from "@/types/apex";

class ApexDatabase extends Dexie {
  completions!: Table<TaskCompletion, number>;
  products!: Table<Product, number>;
  photos!: Table<ProgressPhoto, number>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("apex-local");
    this.version(1).stores({
      completions: "++id, [dateKey+taskId], dateKey, taskId",
      products: "++id, category, name, purchaseDate",
      photos: "++id, zone, createdAt",
      settings: "id"
    });
  }
}

export const db = new ApexDatabase();

export const defaultSettings: AppSettings = {
  id: "settings",
  theme: "dark",
  morningReminder: "08:00",
  nightReminder: "21:00",
  dermarollerReminder: true,
  notificationsEnabled: false
};

export async function ensureSettings() {
  const current = await db.settings.get("settings");
  if (current) return current;
  await db.settings.put(defaultSettings);
  return defaultSettings;
}
