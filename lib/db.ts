"use client";

import Dexie, { type Table } from "dexie";
import type { AgendaNote, ApexAlert, AppSettings, BodyMeasurement, ChatMessage, FoodCacheItem, NutritionLog, Product, ProductConsumption, ProgressPhoto, ShoppingItem, SleepLog, TaskCompletion, Workout } from "@/types/apex";

class ApexDatabase extends Dexie {
  completions!: Table<TaskCompletion, number>;
  products!: Table<Product, number>;
  productConsumptions!: Table<ProductConsumption, number>;
  alerts!: Table<ApexAlert, number>;
  nutritionLogs!: Table<NutritionLog, number>;
  foodCache!: Table<FoodCacheItem, number>;
  workouts!: Table<Workout, number>;
  bodyMeasurements!: Table<BodyMeasurement, number>;
  shoppingItems!: Table<ShoppingItem, number>;
  chatMessages!: Table<ChatMessage, number>;
  agendaNotes!: Table<AgendaNote, number>;
  sleepLogs!: Table<SleepLog, number>;
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
    this.version(2).stores({
      completions: "++id, [dateKey+taskId], dateKey, taskId",
      products: "++id, category, name, brand, purchaseDate",
      productConsumptions: "++id, productId, dateKey, createdAt",
      alerts: "++id, status, severity, source, productId, dueDateKey, createdAt",
      nutritionLogs: "++id, &dateKey, createdAt",
      workouts: "++id, dateKey, focus, createdAt",
      photos: "++id, zone, createdAt",
      settings: "id"
    });
    this.version(3).stores({
      completions: "++id, [dateKey+taskId], dateKey, taskId",
      products: "++id, category, group, name, brand, purchaseDate",
      productConsumptions: "++id, productId, dateKey, createdAt",
      alerts: "++id, status, severity, source, productId, dueDateKey, createdAt",
      nutritionLogs: "++id, &dateKey, createdAt",
      workouts: "++id, dateKey, focus, createdAt",
      bodyMeasurements: "++id, dateKey, createdAt",
      shoppingItems: "++id, status, category, source, productId, createdAt",
      chatMessages: "++id, role, createdAt",
      photos: "++id, zone, createdAt",
      settings: "id"
    });
    this.version(4).stores({
      completions: "++id, [dateKey+taskId], dateKey, taskId",
      products: "++id, category, group, name, brand, purchaseDate",
      productConsumptions: "++id, productId, dateKey, createdAt",
      alerts: "++id, status, severity, source, productId, dueDateKey, createdAt",
      nutritionLogs: "++id, &dateKey, createdAt",
      foodCache: "++id, &key, createdAt",
      workouts: "++id, dateKey, focus, createdAt",
      bodyMeasurements: "++id, dateKey, createdAt",
      shoppingItems: "++id, status, category, source, productId, createdAt",
      chatMessages: "++id, role, createdAt",
      agendaNotes: "++id, &dateKey, updatedAt",
      sleepLogs: "++id, &dateKey, createdAt",
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
  notificationsEnabled: false,
  nutritionGoal: "Mantener energia, subir proteina y sostener composicion corporal.",
  trainingGoal: "Progresar fuerza con buena recuperacion."
};

export async function ensureSettings() {
  const current = await db.settings.get("settings");
  if (current) return current;
  await db.settings.put(defaultSettings);
  return defaultSettings;
}
