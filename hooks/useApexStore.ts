"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { db, defaultSettings, ensureSettings } from "@/lib/db";
import { dateKey } from "@/lib/date";
import type { AppSettings, Product, ProgressPhoto, TaskCompletion } from "@/types/apex";

export function useApexStore(selectedDate: Date) {
  const selectedDateKey = useMemo(() => dateKey(selectedDate), [selectedDate]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [allCompletions, setAllCompletions] = useState<TaskCompletion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [nextCompletions, nextProducts, nextPhotos, nextSettings] = await Promise.all([
      db.completions.where("dateKey").equals(selectedDateKey).toArray(),
      db.products.orderBy("purchaseDate").reverse().toArray(),
      db.photos.orderBy("createdAt").reverse().toArray(),
      ensureSettings()
    ]);
    setCompletions(nextCompletions);
    setAllCompletions(await db.completions.toArray());
    setProducts(nextProducts);
    setPhotos(nextPhotos);
    setSettingsState(nextSettings);
    setReady(true);
  }, [selectedDateKey]);

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
      await db.products.add({ ...product, createdAt: new Date().toISOString() });
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
    photos,
    settings,
    isDone,
    toggleTask,
    addProduct,
    updateProductQuantity,
    addPhoto,
    updateSettings,
    exportData,
    refresh
  };
}
