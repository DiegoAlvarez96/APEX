"use client";

import { Beef, Camera, Check, Copy, Droplets, Eye, Flame, Loader2, Pencil, Plus, Search, Sparkles, Trash2, Wheat, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CompactDisclosure } from "@/components/ui/CompactDisclosure";
import { Card } from "@/components/ui/Card";
import { DateNavigator } from "@/components/ui/DateNavigator";
import { InlineStatus, LoadingButton } from "@/components/ui/Loading";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FoodEstimateError } from "@/hooks/useApexStore";
import { DateTimeService } from "@/lib/date";
import { calculateNutritionTotals, createDrinkEntry, defaultNutritionPlan, parseFoodText, suggestFoods } from "@/lib/nutrition";
import type { DrinkEntry, DrinkType, FoodEntry, FoodVisionResult, FoodVisionOption, NutritionLog, NutritionPlanItem } from "@/types/apex";

type Mode = "text" | "search" | "photo";
type DrinkUnit = "ml" | "cc" | "l";

export function NutritionSmartView({
  nutrition,
  selectedDate,
  selectedDateKey,
  onSelectDate,
  onSave,
  onDelete,
  onEstimateFood,
  onGeneratePlan
}: {
  nutrition?: NutritionLog;
  selectedDate: Date;
  selectedDateKey: string;
  onSelectDate: (date: Date) => void;
  onSave: (values: Omit<NutritionLog, "id" | "createdAt" | "updatedAt">) => Promise<void> | void;
  onDelete: (id: number) => void;
  onEstimateFood: (text: string) => Promise<FoodEntry>;
  onGeneratePlan: (targetDateKey?: string) => Promise<NutritionPlanItem[]>;
}) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [weightKg, setWeightKg] = useState(nutrition?.weightKg ?? 0);
  const [meals, setMeals] = useState<FoodEntry[]>(nutrition?.meals ?? []);
  const [planItems, setPlanItems] = useState<NutritionPlanItem[]>(nutrition?.planItems ?? defaultNutritionPlan);
  const [drinks, setDrinks] = useState<DrinkEntry[]>(nutrition?.drinks ?? []);
  const [drinkType, setDrinkType] = useState<DrinkType>("water");
  const [drinkAmount, setDrinkAmount] = useState(500);
  const [drinkUnit, setDrinkUnit] = useState<DrinkUnit>("ml");
  const [loading, setLoading] = useState<"food" | "photo" | "plan" | "autosave" | "delete" | undefined>();
  const [status, setStatus] = useState<{ message?: string; tone?: "info" | "success" | "error" }>({});
  const [selectedFood, setSelectedFood] = useState<FoodEntry>();
  const [editingFood, setEditingFood] = useState<FoodEntry>();
  const [editingPlan, setEditingPlan] = useState<{ item: NutritionPlanItem; text: string }>();
  const [recalculatingPlanIds, setRecalculatingPlanIds] = useState<string[]>([]);
  const [visionConfirm, setVisionConfirm] = useState<{ options: FoodVisionOption[]; foods?: FoodEntry[]; other: string }>();
  const [defaultConfirm, setDefaultConfirm] = useState<{ entry: FoodEntry; original: string }>();
  const totals = useMemo(() => calculateNutritionTotals(meals, planItems, drinks), [drinks, meals, planItems]);
  const waterMl = drinks.filter((drink) => drink.type === "water").reduce((sum, drink) => sum + drink.amountMl, 0);
  const suggestions = suggestFoods(query);
  const frequentFoods = useMemo(() => buildFrequentFoods(meals, text), [meals, text]);

  useEffect(() => {
    setWeightKg(nutrition?.weightKg ?? 0);
    setMeals(nutrition?.meals ?? []);
    setPlanItems(nutrition?.planItems ?? defaultNutritionPlan);
    setDrinks(nutrition?.drinks ?? []);
    setSelectedFood(undefined);
    setEditingFood(undefined);
    setEditingPlan(undefined);
    setRecalculatingPlanIds([]);
  }, [nutrition, selectedDateKey]);

  async function autosave(nextMeals = meals, nextPlan = planItems, nextDrinks = drinks, nextWeight = weightKg) {
    const nextTotals = calculateNutritionTotals(nextMeals, nextPlan, nextDrinks);
    setLoading("autosave");
    try {
      await onSave({
        ...nextTotals,
        meals: nextMeals,
        planItems: nextPlan,
        drinks: nextDrinks,
        waterMl: nextDrinks.filter((drink) => drink.type === "water").reduce((sum, drink) => sum + drink.amountMl, 0),
        weightKg: nextWeight || undefined,
        dateKey: selectedDateKey
      });
      setStatus({ message: "Guardado.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo guardar nutricion.", tone: "error" });
    } finally {
      setLoading(undefined);
    }
  }

  async function addTextFoods() {
    if (!text.trim()) return;
    setLoading("food");
    setStatus({ message: "Calculando calorias...", tone: "info" });
    const parsed = parseFoodText(text);
    try {
      const enriched = await Promise.all(parsed.map((food) => onEstimateFood(food.inputText ?? food.name)));
      const nextMeals = [...meals, ...enriched];
      setMeals(nextMeals);
      setText("");
      await autosave(nextMeals);
    } catch (error) {
      handleFoodEstimateError(error, text);
    } finally {
      setLoading(undefined);
    }
  }

  async function generatePlan() {
    setLoading("plan");
    setStatus({ message: "Generando plan con OpenAI...", tone: "info" });
    try {
      const nextPlan = await onGeneratePlan(selectedDateKey);
      setPlanItems(nextPlan);
      await autosave(meals, nextPlan, drinks);
      setStatus({ message: "Plan generado para la fecha seleccionada.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo generar el plan nutricional con OpenAI.", tone: "error" });
    } finally {
      setLoading(undefined);
    }
  }

  async function addFood(foodName: string) {
    setLoading("food");
    setStatus({ message: "Consultando alimento...", tone: "info" });
    try {
      const food = await onEstimateFood(foodName);
      const nextMeals = [...meals, { ...food, source: "autocomplete" as const, estimated: false }];
      setMeals(nextMeals);
      setQuery("");
      await autosave(nextMeals);
    } catch (error) {
      handleFoodEstimateError(error, foodName);
    } finally {
      setLoading(undefined);
    }
  }

  async function handlePhoto(file: File | null) {
    if (!file) return;
    setLoading("photo");
    setStatus({ message: "Analizando imagen...", tone: "info" });
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (typeof reader.result !== "string") return;
        const response = await fetch("/api/ai/vision/food", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result })
        });
        const result = (await response.json()) as FoodVisionResult;
        if (Array.isArray(result)) {
          const nextMeals = [...meals, ...result.map((food) => ({ ...food, calculationMethod: food.calculationMethod ?? "photo", createdAt: food.createdAt ?? DateTimeService.nowIso() }))];
          setMeals(nextMeals);
          await autosave(nextMeals);
          setStatus({ message: "Imagen analizada y guardada.", tone: "success" });
        } else {
          setVisionConfirm({ options: result.options, foods: result.foods, other: "" });
          setStatus({ message: result.message ?? "Confirmá el alimento detectado.", tone: "info" });
        }
      } catch {
        setStatus({ message: "No se pudo analizar la imagen.", tone: "error" });
      } finally {
        setLoading(undefined);
      }
    };
    reader.readAsDataURL(file);
  }

  async function confirmPhotoFood(label: string) {
    const value = label === "Otro" ? visionConfirm?.other.trim() : label;
    if (!value) return;
    setLoading("food");
    try {
      const food = await onEstimateFood(value);
      const nextMeals: FoodEntry[] = [...meals, { ...food, source: "photo", calculationMethod: "photo", createdAt: DateTimeService.nowIso() }];
      setMeals(nextMeals);
      setVisionConfirm(undefined);
      await autosave(nextMeals);
    } catch (error) {
      handleFoodEstimateError(error, value);
    } finally {
      setLoading(undefined);
    }
  }

  async function addDrink() {
    const entry = createDrinkEntry(drinkType, drinkAmount, drinkUnit);
    const nextDrinks = [...drinks, entry];
    setDrinks(nextDrinks);
    await autosave(meals, planItems, nextDrinks);
  }

  function handleFoodEstimateError(error: unknown, original: string) {
    if (error instanceof FoodEstimateError) {
      if (error.code === "quota") {
        setStatus({ message: "Sin créditos en OpenAI. Revisá el saldo de la API.", tone: "error" });
        return;
      }
      if (error.code === "parse_error" && error.defaultEntry) {
        setDefaultConfirm({ entry: error.defaultEntry, original });
        setStatus({ message: "Error al parsear la respuesta de OpenAI.", tone: "error" });
        return;
      }
      setStatus({ message: "No se pudo obtener respuesta de OpenAI. Reintentá.", tone: "error" });
      return;
    }
    setStatus({ message: "No se pudo obtener respuesta de OpenAI. Reintentá.", tone: "error" });
  }

  async function acceptDefaultFood() {
    if (!defaultConfirm) return;
    const entry: FoodEntry = { ...defaultConfirm.entry, source: "default_manual_confirmed", calculationMethod: "fallback", createdAt: DateTimeService.nowIso() };
    const nextMeals = [...meals, entry];
    console.info("[nutrition-openai:source_final]", JSON.stringify({ source: entry.source, calculationMethod: entry.calculationMethod, original: defaultConfirm.original }));
    setMeals(nextMeals);
    setDefaultConfirm(undefined);
    setText("");
    await autosave(nextMeals);
  }

  function rejectDefaultFood() {
    console.info("[nutrition-openai:default_rejected]", JSON.stringify({ original: defaultConfirm?.original }));
    setDefaultConfirm(undefined);
    setStatus({ message: "Carga cancelada. No se guardó el alimento.", tone: "info" });
  }

  async function togglePlan(itemId: string) {
    const nextPlan = planItems.map((currentItem) => currentItem.id === itemId ? { ...currentItem, done: !currentItem.done } : currentItem);
    setPlanItems(nextPlan);
    await autosave(meals, nextPlan, drinks);
  }

  function openPlanEditor(item: NutritionPlanItem) {
    setEditingPlan({ item, text: planItemEditableText(item) });
  }

  async function closePlanEditor() {
    if (!editingPlan) return;
    const draftText = editingPlan.text.trim();
    const currentItem = planItems.find((item) => item.id === editingPlan.item.id);
    setEditingPlan(undefined);
    if (!currentItem || !draftText || draftText === planItemEditableText(currentItem).trim()) return;

    const draftedItem = applyPlanText(currentItem, draftText);
    const nextPlan = planItems.map((item) => item.id === draftedItem.id ? draftedItem : item);
    setPlanItems(nextPlan);
    setRecalculatingPlanIds((current) => current.includes(draftedItem.id) ? current : [...current, draftedItem.id]);
    await autosave(meals, nextPlan, drinks);
    await recalculatePlanItem(draftedItem, draftText, nextPlan);
  }

  async function recalculatePlanItem(item: NutritionPlanItem, detail: string, basePlan: NutritionPlanItem[]) {
    setRecalculatingPlanIds((current) => current.includes(item.id) ? current : [...current, item.id]);
    setStatus({ message: "Calculando macros de la comida...", tone: "info" });
    try {
      const food = await onEstimateFood(detail);
      const nextItem: NutritionPlanItem = {
        ...item,
        name: food.name || item.name,
        amountLabel: food.amountLabel ?? item.amountLabel,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber
      };
      const nextPlan = basePlan.map((planItem) => planItem.id === item.id ? nextItem : planItem);
      setPlanItems(nextPlan);
      await autosave(meals, nextPlan, drinks);
      setStatus({ message: "Macros actualizados.", tone: "success" });
    } catch (error) {
      handleFoodEstimateError(error, detail);
    } finally {
      setRecalculatingPlanIds((current) => current.filter((id) => id !== item.id));
    }
  }

  async function updateFood(food: FoodEntry) {
    const nextMeals = meals.map((meal) => meal.id === food.id ? food : meal);
    setMeals(nextMeals);
    setSelectedFood(food);
    setEditingFood(undefined);
    await autosave(nextMeals);
  }

  async function duplicateFood(food: FoodEntry) {
    const nextMeals = [...meals, { ...food, id: DateTimeService.id("food-copy"), createdAt: DateTimeService.nowIso() }];
    setMeals(nextMeals);
    await autosave(nextMeals);
  }

  async function deleteFood(foodId: string) {
    const nextMeals = meals.filter((item) => item.id !== foodId);
    setMeals(nextMeals);
    if (selectedFood?.id === foodId) setSelectedFood(undefined);
    await autosave(nextMeals);
  }

  async function deleteDrink(drinkId: string) {
    const nextDrinks = drinks.filter((drink) => drink.id !== drinkId);
    setDrinks(nextDrinks);
    await autosave(meals, planItems, nextDrinks);
  }

  async function deleteDay() {
    if (!nutrition?.id) return;
    setLoading("delete");
    try {
      await onDelete(nutrition.id);
      setStatus({ message: "Dia eliminado.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo eliminar el dia.", tone: "error" });
    } finally {
      setLoading(undefined);
    }
  }

  const planDone = planItems.filter((item) => item.done).length;
  const calorieGoal = Math.max(1800, Math.round((totals.calories || 2200) / 100) * 100);
  const proteinGoal = weightKg ? Math.max(120, Math.round(weightKg * 2)) : 160;
  const waterGoal = 3000;
  const macroStats = [
    { label: "Kcal", value: Math.round(totals.calories), goal: calorieGoal, icon: Flame },
    { label: "Proteina", value: Math.round(totals.protein), goal: proteinGoal, icon: Beef },
    { label: "Carbos", value: Math.round(totals.carbs), goal: 260, icon: Wheat },
    { label: "Agua", value: Math.round(waterMl / 100) / 10, goal: waterGoal / 1000, icon: Droplets, suffix: "L" }
  ];

  return (
    <div className="space-y-3">
      <DateNavigator title="Nutricion" eyebrow="Plan, comidas y bebidas" selectedDate={selectedDate} onSelectDate={onSelectDate} />


      <Card className="p-3">
        <div className="mb-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Nuevo</p>
            <h2 className="text-base font-semibold">Agregar comida</h2>
          </div>
          <SegmentedControl value={mode} onChange={setMode} options={[{ value: "text", label: "Nuevo" }, { value: "search", label: "Buscar" }, { value: "photo", label: "Foto" }]} />
        </div>
        {mode === "text" ? (
          <div className="grid gap-2">
            <textarea className="min-h-24 rounded-[20px] bg-white/[0.08] px-3 py-3 text-sm outline-none light:bg-black/[0.05]" placeholder="Ej: avena, banana, whey o 150 g pollo con arroz..." value={text} onChange={(event) => setText(event.target.value)} />
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {frequentFoods.map((food) => (
                <button key={food} type="button" className="shrink-0 rounded-full bg-[rgb(var(--module-accent))]/14 px-3 py-1.5 text-xs font-semibold text-[rgb(var(--module-accent))]" onClick={() => void addFood(food)}>
                  {food}
                </button>
              ))}
            </div>
            <LoadingButton loading={loading === "food"} loadingLabel="Calculando..." className="apex-action flex h-11 items-center justify-center gap-2 rounded-[18px] font-semibold" onClick={() => void addTextFoods()}><Plus size={15} /> Agregar</LoadingButton>
          </div>
        ) : null}
        {mode === "search" ? (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 rounded-[18px] bg-white/[0.08] px-4 py-3 light:bg-black/[0.05]"><Search size={18} /><input className="w-full bg-transparent outline-none" placeholder="Banana, pollo, arroz..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            <div className="grid gap-2">
              {suggestions.map((food) => <button key={food.name} className="rounded-[18px] bg-white/[0.06] p-3 text-left text-sm disabled:opacity-60 light:bg-black/[0.04]" disabled={loading === "food"} onClick={() => void addFood(food.name)}>{food.name}</button>)}
            </div>
          </div>
        ) : null}
        {mode === "photo" ? (
          <label className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-white/20 bg-white/[0.04] light:border-black/15 light:bg-black/[0.03]">
            <Camera className="mb-2 text-[rgb(var(--module-accent))]" /> Tomar o seleccionar foto
            <span className="mt-1 text-xs text-white/45 light:text-black/45">{loading === "photo" ? "Analizando imagen..." : "APEX confirma antes de guardar si hay dudas."}</span>
            <input className="hidden" type="file" accept="image/*" capture="environment" onChange={(event) => void handlePhoto(event.target.files?.[0] ?? null)} />
          </label>
        ) : null}
      </Card>

      <Card className="p-3">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Plan del dia</p>
            <h2 className="text-base font-semibold">Comidas sugeridas</h2>
          </div>
          <LoadingButton loading={loading === "plan"} loadingLabel="Generando..." className="min-h-9 rounded-2xl bg-white/[0.09] px-3 text-xs font-semibold" onClick={() => void generatePlan()}>Generar</LoadingButton>
        </div>
        {(["Desayuno", "Colacion manana", "Almuerzo", "Merienda", "Colacion tarde", "Cena"] as const).map((meal) => (
          <div key={meal} className="mb-3 last:mb-0">
            <p className="mb-2 text-xs font-semibold text-[rgb(var(--muted))]">{meal}</p>
            <div className="space-y-2">
              {planItems.filter((item) => item.meal === meal).map((item) => {
                const isRecalculating = recalculatingPlanIds.includes(item.id);
                const mutedText = item.done ? "text-black/65" : "text-white/45 light:text-black/45";
                return (
                  <div
                    key={item.id}
                    className={`relative flex w-full items-start gap-3 rounded-2xl px-3 py-2 pr-11 text-left text-sm transition ${item.done ? "bg-[rgb(var(--module-accent))] text-[rgb(var(--bg))]" : "bg-white/[0.06] light:bg-black/[0.04]"}`}
                  >
                    <button
                      className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white/10 light:bg-black/5"
                      onClick={() => void togglePlan(item.id)}
                      disabled={loading === "autosave"}
                      type="button"
                      aria-label={item.done ? "Marcar comida pendiente" : "Marcar comida hecha"}
                    >
                      <Check size={16} />
                    </button>
                    <button className="min-w-0 flex-1 text-left" onClick={() => void togglePlan(item.id)} disabled={loading === "autosave"} type="button">
                      <span className="block font-medium">{item.name}{item.amountLabel ? ` - ${item.amountLabel}` : ""}</span>
                      {item.components?.length ? (
                        <span className={`mt-1 block text-xs leading-5 ${mutedText}`}>
                          {item.components.map((component) => `${component.name} ${component.amountLabel}`).join(" + ")}
                        </span>
                      ) : null}
                      {item.notes ? <span className={`mt-1 block text-xs leading-5 ${item.done ? "text-black/55" : "text-white/40 light:text-black/40"}`}>{item.notes}</span> : null}
                      {isRecalculating ? (
                        <span className={`mt-2 flex items-center gap-1.5 text-xs ${mutedText}`}>
                          <Loader2 className="animate-spin" size={13} /> Calculando macros
                        </span>
                      ) : (
                        <span className={`mt-2 block text-xs ${mutedText}`}>
                          {Math.round(item.calories ?? 0)} kcal - P {Math.round(item.protein ?? 0)} g - C {Math.round(item.carbs ?? 0)} g - G {Math.round(item.fat ?? 0)} g
                        </span>
                      )}
                    </button>
                    <button
                      className={`absolute right-2 top-2 grid size-8 place-items-center rounded-full ${item.done ? "bg-black/10 text-black/70" : "bg-white/[0.08] text-white/65 light:bg-black/[0.05] light:text-black/65"}`}
                      onClick={() => openPlanEditor(item)}
                      type="button"
                      aria-label="Editar comida del plan"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </Card>

      <CompactDisclosure title="Bebidas" eyebrow={`${(waterMl / 1000).toFixed(1)} L agua`}>
        <div className="grid grid-cols-[1fr_1fr_0.8fr_auto] gap-2">
          <select className="rounded-2xl bg-white/[0.08] px-3 py-2 outline-none light:bg-black/[0.05]" value={drinkType} onChange={(event) => setDrinkType(event.target.value as DrinkType)}>
            <option value="water">Agua</option>
            <option value="soda">Gaseosa</option>
            <option value="juice">Jugo</option>
            <option value="isotonic">Isotonica</option>
            <option value="alcohol">Alcohol</option>
            <option value="other">Otra</option>
          </select>
          <input className="rounded-2xl bg-white/[0.08] px-3 py-2 outline-none light:bg-black/[0.05]" type="number" value={drinkAmount} onChange={(event) => setDrinkAmount(Number(event.target.value))} />
          <select className="rounded-2xl bg-white/[0.08] px-3 py-2 outline-none light:bg-black/[0.05]" value={drinkUnit} onChange={(event) => setDrinkUnit(event.target.value as DrinkUnit)}>
            <option value="ml">ml</option>
            <option value="cc">cc</option>
            <option value="l">l</option>
          </select>
          <button className="grid size-10 place-items-center rounded-2xl bg-white text-black" onClick={() => void addDrink()} type="button"><Plus size={16} /></button>
        </div>
        <div className="mt-3 space-y-2">
          {drinks.map((drink) => (
            <div key={drink.id} className="flex items-center justify-between rounded-2xl bg-white/[0.06] px-3 py-2 text-sm light:bg-black/[0.04]">
              <span>{drink.type} - {drink.label}</span>
              <div className="flex items-center gap-3">
                <span>{drink.amountMl} ml</span>
                <button onClick={() => void deleteDrink(drink.id)} type="button" aria-label="Eliminar bebida"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </CompactDisclosure>

      <InlineStatus message={loading === "autosave" ? "Guardando..." : status.message} tone={loading === "autosave" ? "info" : status.tone} />

      <CompactDisclosure title="Historial de comidas" eyebrow={`${meals.length} registros`}>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="rounded-2xl bg-white/[0.08] px-3 py-2 text-sm light:bg-black/[0.05]">
            <span className="text-xs text-white/45 light:text-black/45">Peso</span>
            <input className="mt-1 w-full bg-transparent outline-none" type="number" placeholder="kg" value={weightKg} onBlur={() => void autosave(meals, planItems, drinks)} onChange={(event) => setWeightKg(Number(event.target.value))} />
          </label>
          <LoadingButton loading={loading === "delete"} loadingLabel="Borrando..." className="flex h-full items-center justify-center gap-1 rounded-2xl bg-red-500/20 text-sm text-red-200 light:text-red-700" onClick={() => void deleteDay()}><Trash2 size={16} /> Borrar dia</LoadingButton>
        </div>
        <div className="space-y-2">
          {meals.map((meal) => (
            <div key={meal.id} className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-3 text-sm light:bg-black/[0.04]">
              <button className="min-w-0 flex-1 text-left" onClick={() => setSelectedFood(meal)} type="button">
                <span>{meal.name} {meal.estimated ? <em className="text-white/40 light:text-black/40">(estimado)</em> : null}</span>
                <span className="block text-xs text-white/40 light:text-black/40">{Math.round(meal.calories)} kcal - {meal.calculationMethod ?? meal.source}</span>
              </button>
              <div className="flex gap-2">
                <button onClick={() => setSelectedFood(meal)} type="button" aria-label="Detalle"><Eye size={16} /></button>
                <button onClick={() => void duplicateFood(meal)} type="button" aria-label="Duplicar"><Copy size={16} /></button>
                <button onClick={() => void deleteFood(meal.id)} type="button" aria-label="Eliminar"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {meals.length === 0 ? <p className="text-sm text-white/45 light:text-black/45">Sin comidas extra registradas para este dia.</p> : null}
        </div>
        {selectedFood ? <FoodDetail food={selectedFood} editing={editingFood?.id === selectedFood.id} onEdit={() => setEditingFood(selectedFood)} onCancel={() => setEditingFood(undefined)} onChange={setEditingFood} draft={editingFood ?? selectedFood} onSave={(food) => void updateFood(food)} /> : null}
      </CompactDisclosure>

      <Card className="overflow-hidden p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Nutricion</p>
            <h2 className="mt-1 text-2xl font-semibold">Resumen del dia</h2>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{planDone}/{planItems.length || 0} comidas del plan hechas · {meals.length} extras</p>
          </div>
          <span className="apex-icon size-11 shrink-0 rounded-2xl">
            <Sparkles size={19} />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {macroStats.map((item) => {
            const Icon = item.icon;
            const pct = Math.min(100, Math.round((Number(item.value) / Math.max(Number(item.goal), 1)) * 100));
            return (
              <div key={item.label} className="rounded-[18px] bg-white/[0.055] p-2.5 ring-1 ring-white/8">
                <Icon className="mb-2 text-[rgb(var(--module-accent))]" size={15} />
                <p className="text-[10px] text-[rgb(var(--muted))]">{item.label}</p>
                <p className="mt-1 truncate text-sm font-bold">{item.value}{item.suffix ?? ""}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[rgb(var(--module-accent))]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {visionConfirm ? (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-black/60 p-4 sm:place-items-center">
          <div className="w-full max-w-md rounded-[28px] bg-[#101114] p-5 shadow-2xl light:bg-white">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/45 light:text-black/45">Confirmacion IA</p>
                <h2 className="text-xl font-semibold">A que corresponde esta imagen?</h2>
              </div>
              <button className="grid size-9 place-items-center rounded-full bg-white/[0.08] light:bg-black/[0.05]" type="button" onClick={() => setVisionConfirm(undefined)}><X size={16} /></button>
            </div>
            <div className="grid gap-2">
              {visionConfirm.options.map((option) => (
                <button key={option.label} className="rounded-2xl bg-white/[0.08] px-4 py-3 text-left text-sm light:bg-black/[0.05]" type="button" onClick={() => void confirmPhotoFood(option.label)}>
                  {option.label}
                  {option.confidence ? <span className="ml-2 text-xs text-white/40 light:text-black/40">{Math.round(option.confidence * 100)}%</span> : null}
                </button>
              ))}
              <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Otro..." value={visionConfirm.other} onChange={(event) => setVisionConfirm((current) => current ? { ...current, other: event.target.value } : current)} />
              <LoadingButton loading={loading === "food"} loadingLabel="Calculando..." className="h-11 rounded-2xl bg-[rgb(var(--module-accent))] font-semibold text-[rgb(var(--bg))]" onClick={() => void confirmPhotoFood("Otro")}>Usar otro</LoadingButton>
            </div>
          </div>
        </div>
      ) : null}

      {editingPlan ? (
        <div className="fixed inset-0 z-[72] grid place-items-end bg-black/60 p-4 sm:place-items-center" onMouseDown={() => void closePlanEditor()}>
          <div className="w-full max-w-md rounded-[28px] bg-[#101114] p-5 shadow-2xl light:bg-white" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/45 light:text-black/45">Editar plan</p>
                <h2 className="text-xl font-semibold">{editingPlan.item.meal}</h2>
              </div>
              <button className="grid size-9 place-items-center rounded-full bg-white/[0.08] light:bg-black/[0.05]" type="button" onClick={() => void closePlanEditor()} aria-label="Cerrar editor"><X size={16} /></button>
            </div>
            <textarea
              className="min-h-44 w-full resize-none rounded-2xl bg-white/[0.08] px-4 py-3 text-sm leading-6 outline-none light:bg-black/[0.05]"
              autoFocus
              value={editingPlan.text}
              onChange={(event) => setEditingPlan((current) => current ? { ...current, text: event.target.value } : current)}
            />
          </div>
        </div>
      ) : null}

      {defaultConfirm ? (
        <div className="fixed inset-0 z-[75] grid place-items-end bg-black/60 p-4 sm:place-items-center">
          <div className="w-full max-w-md rounded-[28px] bg-[#101114] p-5 shadow-2xl light:bg-white">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/45 light:text-black/45">OpenAI</p>
                <h2 className="text-xl font-semibold">Error al parsear la respuesta</h2>
              </div>
              <button className="grid size-9 place-items-center rounded-full bg-white/[0.08] light:bg-black/[0.05]" type="button" onClick={rejectDefaultFood}><X size={16} /></button>
            </div>
            <p className="text-sm leading-6 text-white/60 light:text-black/60">¿Querés cargar valores por defecto?</p>
            <div className="mt-4 rounded-2xl bg-white/[0.06] p-3 text-sm light:bg-black/[0.04]">
              <p className="font-semibold">{defaultConfirm.entry.name}</p>
              <p className="mt-1 text-white/50 light:text-black/50">
                {Math.round(defaultConfirm.entry.calories)} kcal - P {defaultConfirm.entry.protein} g - C {defaultConfirm.entry.carbs} g - G {defaultConfirm.entry.fat} g - Fibra {defaultConfirm.entry.fiber} g
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="h-11 rounded-2xl bg-white/[0.08] text-sm light:bg-black/[0.05]" type="button" onClick={rejectDefaultFood}>Cancelar</button>
              <LoadingButton loading={loading === "autosave"} loadingLabel="Guardando..." className="h-11 rounded-2xl bg-[rgb(var(--module-accent))] text-sm font-semibold text-[rgb(var(--bg))]" onClick={() => void acceptDefaultFood()}>Cargar defaults</LoadingButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FoodDetail({
  food,
  draft,
  editing,
  onEdit,
  onCancel,
  onChange,
  onSave
}: {
  food: FoodEntry;
  draft: FoodEntry;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onChange: (food: FoodEntry) => void;
  onSave: (food: FoodEntry) => void;
}) {
  const rows = [
    ["Calorias", `${Math.round(food.calories)} kcal`],
    ["Proteinas", `${food.protein} g`],
    ["Carbohidratos", `${food.carbs} g`],
    ["Grasas", `${food.fat} g`],
    ["Fibra", `${food.fiber} g`],
    ["Cantidad", food.amountLabel ?? food.inputText ?? "-"],
    ["Metodo", food.calculationMethod ?? food.source],
    ["Fecha", DateTimeService.displayDateTime(food.createdAt)]
  ];
  return (
    <div className="mt-4 rounded-3xl bg-white/[0.06] p-3 light:bg-black/[0.04]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-semibold">{food.name}</p>
        <button className="rounded-xl bg-white/[0.08] px-3 py-2 text-xs" onClick={editing ? onCancel : onEdit} type="button">{editing ? "Cancelar" : "Editar"}</button>
      </div>
      {editing ? (
        <div className="grid grid-cols-2 gap-2">
          {(["name", "calories", "protein", "carbs", "fat", "fiber"] as const).map((key) => (
            <input key={key} className="rounded-2xl bg-white/[0.08] px-3 py-2 outline-none light:bg-black/[0.05]" value={String(draft[key])} type={key === "name" ? "text" : "number"} onChange={(event) => onChange({ ...draft, [key]: key === "name" ? event.target.value : Number(event.target.value), calculationMethod: "manual" })} />
          ))}
          <button className="col-span-2 h-10 rounded-2xl bg-[rgb(var(--module-accent))] font-semibold text-[rgb(var(--bg))]" onClick={() => onSave(draft)} type="button">Guardar alimento</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {rows.map(([label, value]) => <div key={label} className="rounded-2xl bg-white/[0.06] p-2 light:bg-black/[0.04]"><p className="text-[11px] text-white/40 light:text-black/40">{label}</p><p className="text-sm font-semibold">{value}</p></div>)}
        </div>
      )}
    </div>
  );
}

function buildFrequentFoods(meals: FoodEntry[], query: string) {
  const fallback = ["Proteina Whey", "Banana", "Avena", "Creatina", "Pollo", "Arroz", "Yogur", "Huevos", "Agua"];
  const counts = new Map<string, number>();
  for (const meal of meals) counts.set(meal.name, (counts.get(meal.name) ?? 0) + 1);
  for (const food of fallback) counts.set(food, counts.get(food) ?? 0);
  const normalized = query.trim().toLowerCase();
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name)
    .filter((name) => !normalized || name.toLowerCase().includes(normalized))
    .slice(0, 10);
}

function planItemEditableText(item: NutritionPlanItem) {
  const lines = [item.name];
  if (item.amountLabel) lines[0] = `${lines[0]} - ${item.amountLabel}`;
  if (item.components?.length) lines.push(item.components.map((component) => `${component.name} ${component.amountLabel}`).join(" + "));
  if (item.notes) lines.push(item.notes);
  return lines.filter(Boolean).join("\n");
}

function applyPlanText(item: NutritionPlanItem, text: string): NutritionPlanItem {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] ?? item.name;
  const [namePart, amountPart] = firstLine.split(/\s+-\s+/, 2);
  return {
    ...item,
    name: namePart.trim() || item.name,
    amountLabel: amountPart?.trim() || undefined,
    components: undefined,
    notes: lines.slice(1).join("\n") || undefined,
    calories: undefined,
    protein: undefined,
    carbs: undefined,
    fat: undefined,
    fiber: undefined
  };
}
