"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { db, defaultSettings, ensureSettings } from "@/lib/db";
import { dateKey } from "@/lib/date";
import { buildStockAlerts, summarizeProductStock } from "@/lib/stock";
import { buildShoppingSuggestions } from "@/lib/shopping";
import { answerLocalChat } from "@/lib/chat";
import { calculateSleepDuration } from "@/lib/sleep";
import type { AgendaNote, ApexAlert, AppSettings, BodyMeasurement, ChatMessage, FoodEntry, NutritionLog, Product, ProductConsumption, ProgressPhoto, ShoppingItem, SleepLog, TaskCompletion, Workout } from "@/types/apex";

export function useApexStore(selectedDate: Date) {
  const selectedDateKey = useMemo(() => dateKey(selectedDate), [selectedDate]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [allCompletions, setAllCompletions] = useState<TaskCompletion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productConsumptions, setProductConsumptions] = useState<ProductConsumption[]>([]);
  const [alerts, setAlerts] = useState<ApexAlert[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agendaNotes, setAgendaNotes] = useState<AgendaNote[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [nextCompletions, nextProducts, nextConsumptions, nextAlerts, nextNutritionLogs, nextWorkouts, nextBody, nextShopping, nextChat, nextAgendaNotes, nextSleepLogs, nextPhotos, nextSettings] = await Promise.all([
      db.completions.where("dateKey").equals(selectedDateKey).toArray(),
      db.products.orderBy("purchaseDate").reverse().toArray(),
      db.productConsumptions.orderBy("createdAt").reverse().toArray(),
      db.alerts.orderBy("createdAt").reverse().toArray(),
      db.nutritionLogs.orderBy("dateKey").reverse().toArray(),
      db.workouts.orderBy("createdAt").reverse().toArray(),
      db.bodyMeasurements.orderBy("createdAt").reverse().toArray(),
      db.shoppingItems.orderBy("createdAt").reverse().toArray(),
      db.chatMessages.orderBy("createdAt").toArray(),
      db.agendaNotes.orderBy("updatedAt").reverse().toArray(),
      db.sleepLogs.orderBy("createdAt").reverse().toArray(),
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
    setBodyMeasurements(nextBody);
    setShoppingItems(nextShopping);
    setChatMessages(nextChat);
    setAgendaNotes(nextAgendaNotes);
    setSleepLogs(nextSleepLogs);
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
  const latestBody = useMemo(() => bodyMeasurements[0], [bodyMeasurements]);
  const selectedAgendaNote = useMemo(() => agendaNotes.find((note) => note.dateKey === selectedDateKey), [agendaNotes, selectedDateKey]);
  const selectedSleep = useMemo(() => sleepLogs.find((log) => log.dateKey === selectedDateKey), [selectedDateKey, sleepLogs]);

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
      await db.products.add({ ...product, group: product.group, initialStock, size: product.size ?? initialStock, quantity: initialStock, createdAt: new Date().toISOString() });
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
    async (values: Omit<NutritionLog, "id" | "createdAt" | "updatedAt">) => {
      const targetDateKey = values.dateKey ?? selectedDateKey;
      const existing = await db.nutritionLogs.where("dateKey").equals(targetDateKey).first();
      const now = new Date().toISOString();
      if (existing?.id) {
        await db.nutritionLogs.update(existing.id, { ...values, updatedAt: now });
      } else {
        await db.nutritionLogs.add({ ...values, dateKey: targetDateKey, createdAt: now, updatedAt: now });
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

  const updateWorkout = useCallback(async (id: number, workout: Partial<Workout>) => {
    await db.workouts.update(id, workout);
    await refresh();
  }, [refresh]);

  const deleteWorkout = useCallback(async (id: number) => {
    await db.workouts.delete(id);
    await refresh();
  }, [refresh]);

  const duplicateWorkout = useCallback(async (workout: Workout) => {
    const { id: _id, createdAt: _createdAt, ...copy } = workout;
    await db.workouts.add({ ...copy, dateKey: selectedDateKey, title: `${workout.title} copia`, createdAt: new Date().toISOString() });
    await refresh();
  }, [refresh, selectedDateKey]);

  const deleteNutritionLog = useCallback(async (id: number) => {
    await db.nutritionLogs.delete(id);
    await refresh();
  }, [refresh]);

  const duplicateNutritionLog = useCallback(async (log: NutritionLog) => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...copy } = log;
    const now = new Date().toISOString();
    await db.nutritionLogs.add({ ...copy, dateKey: selectedDateKey, createdAt: now, updatedAt: now });
    await refresh();
  }, [refresh, selectedDateKey]);

  const addBodyMeasurement = useCallback(async (measurement: Omit<BodyMeasurement, "id" | "dateKey" | "createdAt">) => {
    await db.bodyMeasurements.add({ ...measurement, dateKey: selectedDateKey, createdAt: new Date().toISOString() });
    await refresh();
  }, [refresh, selectedDateKey]);

  const syncShoppingList = useCallback(async () => {
    const existing = await db.shoppingItems.toArray();
    const suggestions = buildShoppingSuggestions(stockSummaries, existing);
    if (suggestions.length) await db.shoppingItems.bulkAdd(suggestions);
    await refresh();
  }, [refresh, stockSummaries]);

  const updateShoppingStatus = useCallback(async (id: number, status: ShoppingItem["status"]) => {
    await db.shoppingItems.update(id, { status, updatedAt: new Date().toISOString() });
    await refresh();
  }, [refresh]);

  const sendChatMessage = useCallback(async (content: string) => {
    await db.chatMessages.add({ role: "user", content, createdAt: new Date().toISOString() });
    const context = { nutrition: selectedNutrition, stock: stockSummaries, workouts, body: latestBody, sleep: selectedSleep };
    let answer = answerLocalChat(content, context);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, context, history: chatMessages.slice(-16) })
      });
      if (response.ok) {
        const data = (await response.json()) as { answer?: string };
        answer = data.answer?.trim() || answer;
      }
    } catch {
      answer = answerLocalChat(content, context);
    }
    await db.chatMessages.add({ role: "assistant", content: answer, createdAt: new Date().toISOString() });
    await refresh();
  }, [chatMessages, latestBody, refresh, selectedNutrition, selectedSleep, stockSummaries, workouts]);

  const clearChat = useCallback(async () => {
    await db.chatMessages.clear();
    await refresh();
  }, [refresh]);

  const saveAgendaNote = useCallback(async (note: string) => {
    const existing = await db.agendaNotes.where("dateKey").equals(selectedDateKey).first();
    const payload = { dateKey: selectedDateKey, note, updatedAt: new Date().toISOString() };
    if (existing?.id) await db.agendaNotes.update(existing.id, payload);
    else await db.agendaNotes.add(payload);
    await refresh();
  }, [refresh, selectedDateKey]);

  const saveSleepLog = useCallback(async (sleepTime: string, wakeTime: string) => {
    const durationMinutes = calculateSleepDuration(sleepTime, wakeTime);
    const existing = await db.sleepLogs.where("dateKey").equals(selectedDateKey).first();
    const payload = { dateKey: selectedDateKey, sleepTime, wakeTime, durationMinutes, updatedAt: new Date().toISOString() };
    if (existing?.id) await db.sleepLogs.update(existing.id, payload);
    else await db.sleepLogs.add({ ...payload, createdAt: new Date().toISOString() });
    await refresh();
  }, [refresh, selectedDateKey]);

  const estimateFood = useCallback(async (text: string): Promise<FoodEntry> => {
    const key = text.trim().toLowerCase();
    const cached = await db.foodCache.where("key").equals(key).first();
    if (cached) return cached.entry;
    const response = await fetch("/api/ai/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const entry = (await response.json()) as FoodEntry;
    await db.foodCache.put({ key, entry, createdAt: new Date().toISOString() });
    return entry;
  }, []);

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
      bodyMeasurements: await db.bodyMeasurements.toArray(),
      shoppingItems: await db.shoppingItems.toArray(),
      chatMessages: await db.chatMessages.toArray(),
      agendaNotes: await db.agendaNotes.toArray(),
      sleepLogs: await db.sleepLogs.toArray(),
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
    bodyMeasurements,
    latestBody,
    shoppingItems,
    chatMessages,
    agendaNotes,
    selectedAgendaNote,
    sleepLogs,
    selectedSleep,
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
    updateWorkout,
    deleteWorkout,
    duplicateWorkout,
    deleteNutritionLog,
    duplicateNutritionLog,
    addBodyMeasurement,
    syncShoppingList,
    updateShoppingStatus,
    sendChatMessage,
    clearChat,
    saveAgendaNote,
    saveSleepLog,
    estimateFood,
    addPhoto,
    updateSettings,
    exportData,
    refresh
  };
}
