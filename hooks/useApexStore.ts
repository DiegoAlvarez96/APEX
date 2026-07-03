"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { db, defaultSettings, ensureSettings } from "@/lib/db";
import { DateTimeService, addDays, dateFromKey, dateKey, monthStart } from "@/lib/date";
import { buildStockAlerts, summarizeProductStock } from "@/lib/stock";
import { buildShoppingSuggestions } from "@/lib/shopping";
import { answerLocalChat } from "@/lib/chat";
import { calculateSleepDuration } from "@/lib/sleep";
import { normalizeNutritionLog } from "@/lib/nutrition";
import { getRoutineForDate } from "@/lib/routines";
import { assignedWorkoutTemplateForDate } from "@/lib/trainingTemplates";
import type { AgendaNote, ApexAlert, AppSettings, BodyMeasurement, ChatMessage, FoodEntry, NutritionLog, NutritionPlanItem, Product, ProductConsumption, ProgressPhoto, ShoppingItem, SleepLog, TaskCompletion, Workout, WorkoutTemplate } from "@/types/apex";

const APEX_PROCESS_START_DATE_KEY = "2026-07-01";

export function useApexStore(selectedDate: Date) {
  const selectedDateKey = useMemo(() => dateKey(selectedDate), [selectedDate]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [allCompletions, setAllCompletions] = useState<TaskCompletion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productConsumptions, setProductConsumptions] = useState<ProductConsumption[]>([]);
  const [alerts, setAlerts] = useState<ApexAlert[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agendaNotes, setAgendaNotes] = useState<AgendaNote[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [chatAiStatus, setChatAiStatus] = useState<"available" | "offline" | "checking">("offline");
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [nextCompletions, nextProducts, nextConsumptions, nextAlerts, nextNutritionLogs, nextWorkouts, nextTemplates, nextBody, nextShopping, nextChat, nextAgendaNotes, nextSleepLogs, nextPhotos, nextSettings] = await Promise.all([
      db.completions.where("dateKey").equals(selectedDateKey).toArray(),
      db.products.orderBy("purchaseDate").reverse().toArray(),
      db.productConsumptions.orderBy("createdAt").reverse().toArray(),
      db.alerts.orderBy("createdAt").reverse().toArray(),
      db.nutritionLogs.orderBy("dateKey").reverse().toArray(),
      db.workouts.orderBy("createdAt").reverse().toArray(),
      db.workoutTemplates.orderBy("updatedAt").reverse().toArray(),
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
    setNutritionLogs(nextNutritionLogs.map(normalizeNutritionLog));
    setWorkouts(nextWorkouts);
    setWorkoutTemplates(nextTemplates);
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
        await db.completions.update(existing.id, { done: nextDone, updatedAt: DateTimeService.nowIso() });
      } else {
        await db.completions.add({
          dateKey: selectedDateKey,
          taskId,
          done: true,
          updatedAt: DateTimeService.nowIso()
        });
      }
      await refresh();
    },
    [refresh, selectedDateKey]
  );

  const addProduct = useCallback(
    async (product: Omit<Product, "id" | "createdAt">) => {
      const initialStock = product.initialStock ?? product.size ?? product.quantity;
      await db.products.add({ ...product, group: product.group, initialStock, size: product.size ?? initialStock, quantity: initialStock, createdAt: DateTimeService.nowIso() });
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
        createdAt: DateTimeService.nowIso()
      });
      await refresh();
    },
    [refresh, selectedDateKey]
  );

  const updateAlertStatus = useCallback(
    async (id: number, status: ApexAlert["status"]) => {
      await db.alerts.update(id, { status, updatedAt: DateTimeService.nowIso() });
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
      const now = DateTimeService.nowIso();
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
    async (workout: Omit<Workout, "id" | "dateKey" | "createdAt"> & { dateKey?: string }) => {
      const now = DateTimeService.nowIso();
      await db.workouts.add({ ...workout, dateKey: workout.dateKey ?? selectedDateKey, createdAt: now, updatedAt: now });
      await refresh();
    },
    [refresh, selectedDateKey]
  );

  const updateWorkout = useCallback(async (id: number, workout: Partial<Workout>) => {
    await db.workouts.update(id, { ...workout, updatedAt: DateTimeService.nowIso() });
    await refresh();
  }, [refresh]);

  const deleteWorkout = useCallback(async (id: number) => {
    await db.workouts.delete(id);
    await refresh();
  }, [refresh]);

  const duplicateWorkout = useCallback(async (workout: Workout) => {
    const { id: _id, createdAt: _createdAt, ...copy } = workout;
    const now = DateTimeService.nowIso();
    await db.workouts.add({ ...copy, dateKey: selectedDateKey, title: `${workout.title} copia`, createdAt: now, updatedAt: now });
    await refresh();
  }, [refresh, selectedDateKey]);

  const addWorkoutTemplate = useCallback(async (template: Omit<WorkoutTemplate, "id" | "createdAt" | "updatedAt">) => {
    const now = DateTimeService.nowIso();
    await db.workoutTemplates.add({ ...template, createdAt: now, updatedAt: now });
    await refresh();
  }, [refresh]);

  const deleteWorkoutTemplate = useCallback(async (id: number) => {
    await db.workoutTemplates.delete(id);
    await refresh();
  }, [refresh]);

  const deleteNutritionLog = useCallback(async (id: number) => {
    await db.nutritionLogs.delete(id);
    await refresh();
  }, [refresh]);

  const duplicateNutritionLog = useCallback(async (log: NutritionLog) => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...copy } = log;
    const now = DateTimeService.nowIso();
    await db.nutritionLogs.add({ ...copy, dateKey: selectedDateKey, createdAt: now, updatedAt: now });
    await refresh();
  }, [refresh, selectedDateKey]);

  const addBodyMeasurement = useCallback(async (measurement: Omit<BodyMeasurement, "id" | "dateKey" | "createdAt">) => {
    await db.bodyMeasurements.add({ ...measurement, dateKey: selectedDateKey, createdAt: DateTimeService.nowIso() });
    await refresh();
  }, [refresh, selectedDateKey]);

  const updateBodyMeasurement = useCallback(async (id: number, measurement: Partial<BodyMeasurement>) => {
    await db.bodyMeasurements.update(id, measurement);
    await refresh();
  }, [refresh]);

  const deleteBodyMeasurement = useCallback(async (id: number) => {
    await db.bodyMeasurements.delete(id);
    await refresh();
  }, [refresh]);

  const syncShoppingList = useCallback(async () => {
    const existing = await db.shoppingItems.toArray();
    const suggestions = buildShoppingSuggestions(stockSummaries, existing);
    if (suggestions.length) await db.shoppingItems.bulkAdd(suggestions);
    await refresh();
  }, [refresh, stockSummaries]);

  const updateShoppingStatus = useCallback(async (id: number, status: ShoppingItem["status"]) => {
    await db.shoppingItems.update(id, { status, updatedAt: DateTimeService.nowIso() });
    await refresh();
  }, [refresh]);

  const buildOpenAiContext = useCallback(() => ({
    process: buildApexProcessContext({
      selectedDate,
      selectedDateKey,
      nutritionLogs,
      productConsumptions,
      workouts,
      workoutTemplates,
      bodyMeasurements,
      sleepLogs,
      shoppingItems,
      alerts,
      completions: allCompletions,
      agendaNotes,
      settings
    }),
    selectedDateKey,
    nutritionToday: selectedNutrition,
    nutritionLogs: recentByDate(nutritionLogs, 30),
    stock: stockSummaries,
    products,
    productConsumptions: recentConsumptions(productConsumptions, 30),
    workouts: recentByDate(workouts, 30),
    workoutTemplates,
    body: latestBody,
    bodyMeasurements: recentBodyMeasurements(bodyMeasurements, 30),
    sleep: selectedSleep,
    sleepLogs: recentByDate(sleepLogs, 30),
    shoppingItems,
    alerts,
    completions: recentByDate(allCompletions, 30),
    agendaNotes: recentByDate(agendaNotes, 30),
    settings
  }), [agendaNotes, alerts, allCompletions, bodyMeasurements, latestBody, nutritionLogs, productConsumptions, products, selectedDate, selectedDateKey, selectedNutrition, selectedSleep, settings, shoppingItems, sleepLogs, stockSummaries, workoutTemplates, workouts]);

  const sendChatMessage = useCallback(async (content: string) => {
    await db.chatMessages.add({ role: "user", content, createdAt: DateTimeService.nowIso() });
    const context = buildOpenAiContext();
    let answer = answerLocalChat(content, context);
    try {
      setChatAiStatus("checking");
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, context, history: chatMessages.slice(-16) })
      });
      if (response.ok) {
        const data = (await response.json()) as { answer?: string; mode?: "openai" | "local" };
        answer = data.answer?.trim() || answer;
        setChatAiStatus(data.mode === "openai" ? "available" : "offline");
      } else {
        setChatAiStatus("offline");
      }
    } catch {
      setChatAiStatus("offline");
      answer = answerLocalChat(content, context);
    }
    await db.chatMessages.add({ role: "assistant", content: answer, createdAt: DateTimeService.nowIso() });
    await refresh();
  }, [chatMessages, refresh, buildOpenAiContext]);

  const clearChat = useCallback(async () => {
    await db.chatMessages.clear();
    await refresh();
  }, [refresh]);

  const saveAgendaNote = useCallback(async (note: string) => {
    const existing = await db.agendaNotes.where("dateKey").equals(selectedDateKey).first();
    const payload = { dateKey: selectedDateKey, note, updatedAt: DateTimeService.nowIso() };
    if (existing?.id) await db.agendaNotes.update(existing.id, payload);
    else await db.agendaNotes.add(payload);
    await refresh();
  }, [refresh, selectedDateKey]);

  const saveSleepLog = useCallback(async (sleepTime: string, wakeTime: string) => {
    const durationMinutes = calculateSleepDuration(sleepTime, wakeTime);
    const existing = await db.sleepLogs.where("dateKey").equals(selectedDateKey).first();
    const payload = { dateKey: selectedDateKey, sleepTime, wakeTime, durationMinutes, updatedAt: DateTimeService.nowIso() };
    if (existing?.id) await db.sleepLogs.update(existing.id, payload);
    else await db.sleepLogs.add({ ...payload, createdAt: DateTimeService.nowIso() });
    await refresh();
  }, [refresh, selectedDateKey]);

  const estimateFood = useCallback(async (text: string): Promise<FoodEntry> => {
    const key = text.trim().toLowerCase();
    const response = await fetch("/api/ai/food", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const payload = (await response.json()) as FoodEntry | FoodEstimateErrorPayload;
    if (!response.ok) {
      const errorPayload = payload as FoodEstimateErrorPayload;
      throw new FoodEstimateError(errorPayload.error ?? "No se pudo calcular el alimento.", errorPayload.code ?? "api_error", errorPayload.defaultEntry);
    }
    const entry = payload as FoodEntry;
    if (!hasValidFoodMacros(entry)) throw new FoodEstimateError("Error al parsear la respuesta de OpenAI.", "parse_error");
    await db.foodCache.where("key").equals(key).delete();
    await db.foodCache.put({ key, entry, createdAt: DateTimeService.nowIso() });
    return entry;
  }, []);

  const generateNutritionPlan = useCallback(async (targetDateKey = selectedDateKey): Promise<NutritionPlanItem[]> => {
    const response = await fetch("/api/ai/nutrition-plan", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetDateKey, context: buildOpenAiContext() })
    });
    const payload = (await response.json()) as { items?: NutritionPlanItem[]; error?: string };
    if (!response.ok || !payload.items?.length) throw new Error(payload.error ?? "No se pudo generar el plan nutricional.");
    return payload.items;
  }, [buildOpenAiContext, selectedDateKey]);

  const generateWorkoutPlan = useCallback(async (targetDateKey = selectedDateKey): Promise<Omit<Workout, "id">> => {
    const response = await fetch("/api/ai/training-plan", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetDateKey, context: buildOpenAiContext() })
    });
    const payload = (await response.json()) as Omit<Workout, "id"> & { error?: string };
    if (!response.ok || !payload.exercises?.length) throw new Error(payload.error ?? "No se pudo generar el entrenamiento.");
    return payload;
  }, [buildOpenAiContext, selectedDateKey]);

  const addPhoto = useCallback(
    async (photo: Omit<ProgressPhoto, "id" | "createdAt">) => {
      await db.photos.add({ ...photo, createdAt: DateTimeService.nowIso() });
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
      exportedAt: DateTimeService.nowIso(),
      completions: await db.completions.toArray(),
      products: await db.products.toArray(),
      productConsumptions: await db.productConsumptions.toArray(),
      alerts: await db.alerts.toArray(),
      nutritionLogs: await db.nutritionLogs.toArray(),
      workouts: await db.workouts.toArray(),
      workoutTemplates: await db.workoutTemplates.toArray(),
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
    workoutTemplates,
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
    chatAiStatus,
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
    addWorkoutTemplate,
    deleteWorkoutTemplate,
    deleteNutritionLog,
    duplicateNutritionLog,
    addBodyMeasurement,
    updateBodyMeasurement,
    deleteBodyMeasurement,
    syncShoppingList,
    updateShoppingStatus,
    sendChatMessage,
    clearChat,
    saveAgendaNote,
    saveSleepLog,
    estimateFood,
    generateNutritionPlan,
    generateWorkoutPlan,
    addPhoto,
    updateSettings,
    exportData,
    refresh
  };
}

type FoodEstimateErrorCode = "api_error" | "quota" | "parse_error";

type FoodEstimateErrorPayload = {
  code?: FoodEstimateErrorCode;
  error?: string;
  question?: string;
  defaultEntry?: FoodEntry;
};

export class FoodEstimateError extends Error {
  code: FoodEstimateErrorCode;
  defaultEntry?: FoodEntry;

  constructor(message: string, code: FoodEstimateErrorCode, defaultEntry?: FoodEntry) {
    super(message);
    this.name = "FoodEstimateError";
    this.code = code;
    this.defaultEntry = defaultEntry;
  }
}

function hasValidFoodMacros(entry: FoodEntry) {
  return entry.calories > 0 && entry.protein >= 0 && entry.carbs >= 0 && entry.fat >= 0 && entry.fiber >= 0 && entry.protein + entry.carbs + entry.fat + entry.fiber > 0;
}

type ApexProcessContextInput = {
  selectedDate: Date;
  selectedDateKey: string;
  nutritionLogs: NutritionLog[];
  productConsumptions: ProductConsumption[];
  workouts: Workout[];
  workoutTemplates: WorkoutTemplate[];
  bodyMeasurements: BodyMeasurement[];
  sleepLogs: SleepLog[];
  shoppingItems: ShoppingItem[];
  alerts: ApexAlert[];
  completions: TaskCompletion[];
  agendaNotes: AgendaNote[];
  settings: AppSettings;
};

function buildApexProcessContext(input: ApexProcessContextInput) {
  const today = DateTimeService.todayDate();
  const todayKey = dateKey(today);
  const startDate = dateFromKey(APEX_PROCESS_START_DATE_KEY);
  const selectedMonthStart = monthStart(input.selectedDate);
  const monthContextStart = selectedMonthStart < startDate ? startDate : selectedMonthStart;
  const selectedMonthEnd = addDays(new Date(Date.UTC(input.selectedDate.getUTCFullYear(), input.selectedDate.getUTCMonth() + 1, 1, 12)), -1);
  const monthContextEnd = selectedMonthEnd < monthContextStart ? monthContextStart : selectedMonthEnd;

  return {
    processStartDateKey: APEX_PROCESS_START_DATE_KEY,
    note: "No hay informacion anterior al 2026-07-01. Tratar fechas previas como fuera del proceso APEX, no como incumplimientos.",
    todayKey,
    selectedDateKey: input.selectedDateKey,
    currentMonth: {
      from: dateKey(monthContextStart),
      to: dateKey(monthContextEnd),
      days: buildDailyContext(monthContextStart, monthContextEnd, input, todayKey)
    },
    futureWeek: {
      from: dateKey(addDays(today, 1)),
      to: dateKey(addDays(today, 7)),
      days: buildDailyContext(addDays(today, 1), addDays(today, 7), input, todayKey)
    },
    activeGoals: {
      nutrition: input.settings.nutritionGoal ?? null,
      training: input.settings.trainingGoal ?? null
    },
    recent30Days: buildRecentContext(input),
    pendingShopping: input.shoppingItems.filter((item) => item.status === "pending"),
    activeAlerts: input.alerts.filter((alert) => alert.status === "active" || alert.status === "buy")
  };
}

function buildRecentContext(input: ApexProcessContextInput) {
  return {
    physical: recentBodyMeasurements(input.bodyMeasurements, 30).map((item) => ({
      dateKey: item.dateKey,
      weightKg: item.weightKg,
      heightCm: item.heightCm ?? null,
      age: item.age ?? null,
      goal: item.goal,
      bodyFatPercent: item.bodyFatPercent ?? null,
      measurements: {
        chestCm: item.chestCm ?? null,
        waistCm: item.waistCm ?? null,
        armsCm: item.armsCm ?? null,
        legsCm: item.legsCm ?? null,
        neckCm: item.neckCm ?? null
      },
      notes: item.notes ?? null
    })),
    nutrition: recentByDate(input.nutritionLogs, 30).map((log) => ({
      dateKey: log.dateKey,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      fiber: log.fiber ?? 0,
      waterMl: log.waterMl,
      meals: (log.meals ?? []).map((meal) => ({
        name: meal.name,
        amountLabel: meal.amountLabel ?? meal.inputText ?? null,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: meal.fiber
      })),
      plan: (log.planItems ?? []).map((item) => ({ meal: item.meal, name: item.name, amountLabel: item.amountLabel ?? null, components: item.components ?? [], done: item.done })),
      drinks: (log.drinks ?? []).map((drink) => ({ type: drink.type, amountMl: drink.amountMl, label: drink.label }))
    })),
    training: recentByDate(input.workouts, 30).map((workout) => ({
      dateKey: workout.dateKey,
      title: workout.title,
      focus: workout.focus,
      intensity: workout.intensity,
      durationMinutes: workout.durationMinutes ?? null,
      completed: Boolean(workout.completed),
      exercises: workout.exercises.map((exercise) => ({
        name: exercise.name,
        completed: Boolean(exercise.completed),
        sets: exercise.sets.map((set) => ({
          reps: set.reps,
          weight: set.weight ?? null,
          rir: set.rir ?? null,
          restSeconds: set.restSeconds ?? null,
          completed: Boolean(set.completed)
        })),
        notes: exercise.notes ?? null
      })),
      notes: workout.notes ?? null
    })),
    habits: {
      sleep: recentByDate(input.sleepLogs, 30).map((sleep) => ({ dateKey: sleep.dateKey, sleepTime: sleep.sleepTime, wakeTime: sleep.wakeTime, durationMinutes: sleep.durationMinutes })),
      completions: recentByDate(input.completions, 30).map((item) => ({ dateKey: item.dateKey, taskId: item.taskId, done: item.done })),
      agendaNotes: recentByDate(input.agendaNotes, 30).map((note) => ({ dateKey: note.dateKey, note: note.note }))
    }
  };
}

function recentByDate<T extends { dateKey: string }>(items: T[], days: number) {
  const minDateKey = dateKey(addDays(DateTimeService.todayDate(), -days));
  return items.filter((item) => item.dateKey >= minDateKey).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

function recentBodyMeasurements(items: BodyMeasurement[], days: number) {
  return recentByDate(items, days);
}

function recentConsumptions(items: ProductConsumption[], days: number) {
  return recentByDate(items, days);
}

function buildDailyContext(start: Date, end: Date, input: ApexProcessContextInput, todayKey: string) {
  const days = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    const key = dateKey(cursor);
    if (key < APEX_PROCESS_START_DATE_KEY) continue;

    const routine = getRoutineForDate(cursor);
    const completions = input.completions.filter((item) => item.dateKey === key);
    const doneTaskIds = new Set(completions.filter((item) => item.done).map((item) => item.taskId));
    const completedRoutineTasks = routine.tasks.filter((task) => doneTaskIds.has(task.id));
    const pendingRoutineTasks = routine.tasks.filter((task) => !doneTaskIds.has(task.id));
    const workouts = input.workouts.filter((workout) => workout.dateKey === key);
    const nutrition = input.nutritionLogs.find((log) => log.dateKey === key);
    const sleep = input.sleepLogs.find((log) => log.dateKey === key);
    const agenda = input.agendaNotes.find((note) => note.dateKey === key);
    const body = input.bodyMeasurements.find((measurement) => measurement.dateKey === key);
    const consumptions = input.productConsumptions.filter((item) => item.dateKey === key);
    const assignedWorkout = assignedWorkoutTemplateForDate(cursor, input.workoutTemplates);
    const isFuture = key > todayKey;

    days.push({
      dateKey: key,
      relationToToday: key === todayKey ? "today" : isFuture ? "future" : "past",
      routine: {
        status: completedRoutineTasks.length === routine.tasks.length ? "done" : isFuture ? "pending" : "incomplete",
        plannedCount: routine.tasks.length,
        doneCount: completedRoutineTasks.length,
        notDoneCount: pendingRoutineTasks.length,
        done: completedRoutineTasks.map((task) => task.label),
        notDone: pendingRoutineTasks.map((task) => task.label)
      },
      nutrition: nutrition
        ? {
            logged: true,
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
            fiber: nutrition.fiber ?? 0,
            waterMl: nutrition.waterMl,
            meals: nutrition.meals?.map((meal) => meal.name) ?? [],
            planDone: nutrition.planItems?.filter((item) => item.done).map((item) => item.name) ?? [],
            planNotDone: nutrition.planItems?.filter((item) => !item.done).map((item) => item.name) ?? []
          }
        : { logged: false },
      training: {
        planned: assignedWorkout
          ? {
              name: assignedWorkout.name,
              group: assignedWorkout.group,
              focus: assignedWorkout.focus,
              exercises: assignedWorkout.exercises.map((exercise) => exercise.name)
            }
          : null,
        registered: workouts.map((workout) => ({
          title: workout.title,
          focus: workout.focus,
          completed: Boolean(workout.completed),
          doneExercises: workout.exercises.filter((exercise) => exercise.completed).map((exercise) => exercise.name),
          notDoneExercises: workout.exercises.filter((exercise) => !exercise.completed).map((exercise) => exercise.name)
        })),
        status: workouts.some((workout) => workout.completed) ? "done" : isFuture ? "pending" : "not_done_or_not_logged"
      },
      sleep: sleep ? { logged: true, sleepTime: sleep.sleepTime, wakeTime: sleep.wakeTime, durationMinutes: sleep.durationMinutes } : { logged: false },
      body: body ? { logged: true, weightKg: body.weightKg, goal: body.goal, bodyFatPercent: body.bodyFatPercent ?? null } : { logged: false },
      productConsumptions: consumptions.map((item) => ({ productId: item.productId, amount: item.amount, note: item.note ?? null })),
      agendaNote: agenda?.note ?? null
    });
  }
  return days;
}
