"use client";

import Dexie, { type Table } from "dexie";
import type { AgendaNote, ApexAlert, AppSettings, BodyMeasurement, ChatMessage, FinanceCategoryRule, FinancePaymentMethod, FinanceScheduledPayment, FinanceSettings, FinanceTransaction, FoodCacheItem, NutritionLog, Product, ProductConsumption, ProgressPhoto, ShoppingItem, SleepLog, SportProfile, TaskCompletion, Workout, WorkoutTemplate } from "@/types/apex";

class ApexDatabase extends Dexie {
  completions!: Table<TaskCompletion, number>;
  products!: Table<Product, number>;
  productConsumptions!: Table<ProductConsumption, number>;
  alerts!: Table<ApexAlert, number>;
  nutritionLogs!: Table<NutritionLog, number>;
  foodCache!: Table<FoodCacheItem, number>;
  workouts!: Table<Workout, number>;
  workoutTemplates!: Table<WorkoutTemplate, number>;
  bodyMeasurements!: Table<BodyMeasurement, number>;
  shoppingItems!: Table<ShoppingItem, number>;
  chatMessages!: Table<ChatMessage, number>;
  agendaNotes!: Table<AgendaNote, number>;
  sleepLogs!: Table<SleepLog, number>;
  financeTransactions!: Table<FinanceTransaction, number>;
  financeCategoryRules!: Table<FinanceCategoryRule, number>;
  financePaymentMethods!: Table<FinancePaymentMethod, number>;
  financeScheduledPayments!: Table<FinanceScheduledPayment, number>;
  financeSettings!: Table<FinanceSettings, string>;
  photos!: Table<ProgressPhoto, number>;
  sportProfiles!: Table<SportProfile, number>;
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
    this.version(5).stores({
      completions: "++id, [dateKey+taskId], dateKey, taskId",
      products: "++id, category, group, name, brand, purchaseDate",
      productConsumptions: "++id, productId, dateKey, createdAt",
      alerts: "++id, status, severity, source, productId, dueDateKey, createdAt",
      nutritionLogs: "++id, &dateKey, createdAt",
      foodCache: "++id, &key, createdAt",
      workouts: "++id, dateKey, focus, createdAt",
      workoutTemplates: "++id, group, source, createdAt, updatedAt",
      bodyMeasurements: "++id, dateKey, createdAt",
      shoppingItems: "++id, status, category, source, productId, createdAt",
      chatMessages: "++id, role, createdAt",
      agendaNotes: "++id, &dateKey, updatedAt",
      sleepLogs: "++id, &dateKey, createdAt",
      photos: "++id, zone, createdAt",
      settings: "id"
    });
    this.version(6).stores({
      completions: "++id, [dateKey+taskId], dateKey, taskId",
      products: "++id, category, group, name, brand, purchaseDate",
      productConsumptions: "++id, productId, dateKey, createdAt",
      alerts: "++id, status, severity, source, productId, dueDateKey, createdAt",
      nutritionLogs: "++id, &dateKey, createdAt",
      foodCache: "++id, &key, createdAt",
      workouts: "++id, dateKey, focus, createdAt",
      workoutTemplates: "++id, group, source, createdAt, updatedAt",
      bodyMeasurements: "++id, dateKey, createdAt",
      shoppingItems: "++id, status, category, source, productId, createdAt",
      chatMessages: "++id, role, createdAt",
      agendaNotes: "++id, &dateKey, updatedAt",
      sleepLogs: "++id, &dateKey, createdAt",
      financeTransactions: "++id, type, category, currency, dateKey, occurredAt, createdAt",
      financeCategoryRules: "++id, &key, category, updatedAt",
      photos: "++id, zone, createdAt",
      settings: "id"
    });
    this.version(7).stores({
      completions: "++id, [dateKey+taskId], dateKey, taskId",
      products: "++id, category, group, name, brand, purchaseDate",
      productConsumptions: "++id, productId, dateKey, createdAt",
      alerts: "++id, status, severity, source, productId, dueDateKey, createdAt",
      nutritionLogs: "++id, &dateKey, createdAt",
      foodCache: "++id, &key, createdAt",
      workouts: "++id, dateKey, focus, createdAt",
      workoutTemplates: "++id, group, source, createdAt, updatedAt",
      bodyMeasurements: "++id, dateKey, createdAt",
      shoppingItems: "++id, status, category, source, productId, createdAt",
      chatMessages: "++id, role, createdAt",
      agendaNotes: "++id, &dateKey, updatedAt",
      sleepLogs: "++id, &dateKey, createdAt",
      financeTransactions: "++id, type, category, currency, dateKey, occurredAt, paymentMethodId, cardPaymentDateKey, createdAt",
      financeCategoryRules: "++id, &key, category, updatedAt",
      financePaymentMethods: "++id, kind, label, updatedAt",
      financeScheduledPayments: "++id, transactionId, dueDateKey, createdAt",
      financeSettings: "id",
      photos: "++id, zone, createdAt",
      settings: "id"
    });
    this.version(8).stores({
      completions: "++id, [dateKey+taskId], dateKey, taskId",
      products: "++id, category, group, name, brand, purchaseDate",
      productConsumptions: "++id, productId, dateKey, createdAt",
      alerts: "++id, status, severity, source, productId, dueDateKey, createdAt",
      nutritionLogs: "++id, &dateKey, createdAt",
      foodCache: "++id, &key, createdAt",
      workouts: "++id, dateKey, focus, createdAt",
      workoutTemplates: "++id, group, source, createdAt, updatedAt",
      bodyMeasurements: "++id, dateKey, createdAt",
      shoppingItems: "++id, status, category, source, productId, createdAt",
      chatMessages: "++id, role, createdAt",
      agendaNotes: "++id, &dateKey, updatedAt",
      sleepLogs: "++id, &dateKey, createdAt",
      financeTransactions: "++id, type, category, currency, dateKey, occurredAt, paymentMethodId, cardPaymentDateKey, createdAt",
      financeCategoryRules: "++id, &key, category, updatedAt",
      financePaymentMethods: "++id, kind, label, updatedAt",
      financeScheduledPayments: "++id, transactionId, dueDateKey, createdAt",
      financeSettings: "id",
      sportProfiles: "++id, status, category, mode, updatedAt",
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

export async function ensureFinanceSettings() {
  const now = new Date().toISOString();
  const current = await db.financeSettings.get("finance");
  if (current) return current;

  const defaultMethod = await db.financePaymentMethods.where("label").equals("Mercado Pago").first();
  let defaultPaymentMethodId = defaultMethod?.id;
  if (!defaultPaymentMethodId) {
    defaultPaymentMethodId = await db.financePaymentMethods.add({
      label: "Mercado Pago",
      kind: "wallet",
      createdAt: now,
      updatedAt: now
    });
  }

  const settings: FinanceSettings = {
    id: "finance",
    defaultPaymentMethodId,
    monthRangeStartDay: 1,
    monthRangeEndDay: 0,
    incomeSources: ["Sueldo", "Cobro deuda", "Facturacion", "2do sueldo", "Otro"],
    createdAt: now,
    updatedAt: now
  };
  await db.financeSettings.put(settings);
  return settings;
}
