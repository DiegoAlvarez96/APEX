"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { db, defaultSettings, ensureSettings } from "@/lib/db";
import { dateKey } from "@/lib/date";
import { buildStockAlerts, summarizeProductStock } from "@/lib/stock";
import type { ApexAlert, AppSettings, NutritionLog, Product, ProductConsumption, ProgressPhoto, TaskCompletion, Workout } from "@/types/apex";

export function useApexStore(selectedDate: Date) {
  const selectedDateKey = useMemo(() => dateKey(selectedDate), [selectedDate]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [allCompletions, setAllCompletions] = useState<TaskCompletion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productConsumptions, setProductConsumptions] = useState<ProductConsumption[]>([]);
  const [alerts, setAlerts] = useState<ApexAlert[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [nextCompletions, nextProducts, nextConsumptions, nextAlerts, nextNutritionLogs, nextWorkouts, nextPhotos, nextSettings] = await Promise.all([
      db.completions.where("dateKey").equals(selectedDateKey).toArray(),
      db.products.orderBy("purchaseDate").reverse().toArray(),
      db.productConsumptions.orderBy("createdAt").reverse().toArray(),
      db.alerts.orderBy("createdAt").reverse().toArray(),
      db.nutritionLogs.orderBy("dateKey").reverse().toArray(),
      db.workouts.orderBy("createdAt").reverse().toArray(),
      db.photos.orderBy("createdAt").reverse().toArray(),
      ensureSettings()
    ]);
    setCompletions(nextCompletions);
    setAllCompletions(await db.completions.toArray());
    setProducts(nextProducts);
    setProductConsumptions(nextConsumptions);
    setAlerts(nextAlerts);
    setNutritionLogs(nextNutritionLogs);
    setWorkouts(nextWorkouts);
    setPhotos(nextPhotos);
    setSettingsState(nextSettings);
    setReady(true);
  }, [selectedDateKey]);

  const stockSummaries = useMemo(
    () => products.map((product) => summarizeProductStock(product, productConsumptions)),
    [productConsumptions, products]
  );

  const selectedNutrition = useMemo(
    () => nutritionLogs.find((log) => log.dateKey === selectedDateKey),
    [nutritionLogs, selectedDateKey]
  );

  const selectedWorkouts = useMemo(
    () => workouts.filter((workout) => workout.dateKey === selectedDateKey),
    [selectedDateKey, workouts]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", settings.theme === "light");
  }, [settings.theme]);

  const isDone = useCallback(
    (taskId: string) => completions.some((item) => item.taskId === taskId && item.done),
    [completions]
  );

  const toggleTask = useCallback(
    async (taskId: string) => {
      const existing = await db.completions
        .where("[dateKey+taskId]")
        .equals([selectedDateKey, taskId])
        .first();
      const nextDone = !existing?.done;
      if (existing?.id) {
        await db.completions.update(existing.id, { done: nextDone, updatedAt: new Date().toISOString() });
      } else {
        await db.completions.add({
          dateKey: selectedDateKey,
          taskId,
          done: true,
          updatedAt: new Date().toISOString()
        });
      }
      await refresh();
    },
    [refresh, selectedDateKey]
  );

  const addProduct = useCallback(
    async (product: Omit<Product, "id" | "createdAt">) => {
      const initialStock = product.initialStock ?? product.size ?? product.quantity;
      await db.products.add({ ...product, initialStock, size: product.size ?? initialStock, quantity: initialStock, createdAt: new Date().toISOString() });
      await refresh();
    },
    [refresh]
  );

  const updateProductQuantity = useCallback(
    async (id: number, quantity: number) => {
      await db.products.update(id, { quantity });
      await refresh();
    },
    [refresh]
  );

  const addProductConsumption = useCallback(
    async (productId: number, amount: number, note?: string) => {
      await db.productConsumptions.add({
        productId,
        amount,
        note,
        dateKey: selectedDateKey,
        createdAt: new Date().toISOString()
      });
      await refresh();
    },
    [refresh, selectedDateKey]
  );

  const updateAlertStatus = useCallback(
    async (id: number, status: ApexAlert["status"]) => {
      await db.alerts.update(id, { status, updatedAt: new Date().toISOString() });
      await refresh();
    },
    [refresh]
  );

  const syncStockAlerts = useCallback(async () => {
    const existing = await db.alerts.toArray();
    const nextAlerts = buildStockAlerts(stockSummaries, existing);
    if (nextAlerts.length) await db.alerts.bulkAdd(nextAlerts);
    await refresh();
  }, [refresh, stockSummaries]);

  const upsertNutritionLog = useCallback(
    async (values: Omit<NutritionLog, "id" | "dateKey" | "createdAt" | "updatedAt">) => {
      const existing = await db.nutritionLogs.where("dateKey").equals(selectedDateKey).first();
      const now = new Date().toISOString();
      if (existing?.id) {
        await db.nutritionLogs.update(existing.id, { ...values, updatedAt: now });
      } else {
        await db.nutritionLogs.add({ ...values, dateKey: selectedDateKey, createdAt: now, updatedAt: now });
      }
      await refresh();
    },
    [refresh, selectedDateKey]
  );

  const addWorkout = useCallback(
    async (workout: Omit<Workout, "id" | "dateKey" | "createdAt">) => {
      await db.workouts.add({ ...workout, dateKey: selectedDateKey, createdAt: new Date().toISOString() });
      await refresh();
    },
    [refresh, selectedDateKey]
  );

  const addPhoto = useCallback(
    async (photo: Omit<ProgressPhoto, "id" | "createdAt">) => {
      await db.photos.add({ ...photo, createdAt: new Date().toISOString() });
      await refresh();
    },
    [refresh]
  );

  const updateSettings = useCallback(
    async (next: Partial<AppSettings>) => {
      const merged = { ...settings, ...next };
      await db.settings.put(merged);
      setSettingsState(merged);
    },
    [settings]
  );

  const exportData = useCallback(async () => {
    const data = {
      exportedAt: new Date().toISOString(),
      completions: await db.completions.toArray(),
      products: await db.products.toArray(),
      productConsumptions: await db.productConsumptions.toArray(),
      alerts: await db.alerts.toArray(),
      nutritionLogs: await db.nutritionLogs.toArray(),
      workouts: await db.workouts.toArray(),
      photos: await db.photos.toArray(),
      settings: await db.settings.toArray()
    };
    return JSON.stringify(data, null, 2);
  }, []);

  return {
    ready,
    completions,
    allCompletions,
    products,
    productConsumptions,
    stockSummaries,
    alerts,
    nutritionLogs,
    selectedNutrition,
    workouts,
    selectedWorkouts,
    photos,
    settings,
    isDone,
    toggleTask,
    addProduct,
    updateProductQuantity,
    addProductConsumption,
    updateAlertStatus,
    syncStockAlerts,
    upsertNutritionLog,
    addWorkout,
    addPhoto,
    updateSettings,
    exportData,
    refresh
  };
}
