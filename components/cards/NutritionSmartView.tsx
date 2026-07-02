"use client";

import { Camera, Check, Copy, Eye, Plus, Save, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { InlineStatus, LoadingButton } from "@/components/ui/Loading";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { defaultNutritionPlan, drinkToMl, parseFoodText, suggestFoods, sumMeals } from "@/lib/nutrition";
import type { DrinkEntry, DrinkType, FoodEntry, NutritionLog, NutritionPlanItem } from "@/types/apex";

type Mode = "text" | "search" | "photo";
type DrinkUnit = "ml" | "cc" | "l";

export function NutritionSmartView({
  nutrition,
  selectedDateKey,
  onSave,
  onDelete,
  onEstimateFood
}: {
  nutrition?: NutritionLog;
  selectedDateKey: string;
  onSave: (values: Omit<NutritionLog, "id" | "createdAt" | "updatedAt">) => Promise<void> | void;
  onDelete: (id: number) => void;
  onEstimateFood: (text: string) => Promise<FoodEntry>;
}) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(nutrition?.dateKey ?? selectedDateKey);
  const [weightKg, setWeightKg] = useState(nutrition?.weightKg ?? 0);
  const [meals, setMeals] = useState<FoodEntry[]>(nutrition?.meals ?? []);
  const [planItems, setPlanItems] = useState<NutritionPlanItem[]>(nutrition?.planItems ?? defaultNutritionPlan);
  const [drinks, setDrinks] = useState<DrinkEntry[]>(nutrition?.drinks ?? []);
  const [drinkType, setDrinkType] = useState<DrinkType>("water");
  const [drinkAmount, setDrinkAmount] = useState(500);
  const [drinkUnit, setDrinkUnit] = useState<DrinkUnit>("ml");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState<"food" | "photo" | "save" | "autosave" | undefined>();
  const [status, setStatus] = useState<{ message?: string; tone?: "info" | "success" | "error" }>({});
  const [selectedFood, setSelectedFood] = useState<FoodEntry>();
  const [editingFood, setEditingFood] = useState<FoodEntry>();
  const totals = useMemo(() => sumMeals(meals), [meals]);
  const waterMl = drinks.filter((drink) => drink.type === "water").reduce((sum, drink) => sum + drink.amountMl, 0);
  const suggestions = suggestFoods(query);

  useEffect(() => {
    setDate(nutrition?.dateKey ?? selectedDateKey);
    setWeightKg(nutrition?.weightKg ?? 0);
    setMeals(nutrition?.meals ?? []);
    setPlanItems(nutrition?.planItems ?? defaultNutritionPlan);
    setDrinks(nutrition?.drinks ?? []);
  }, [nutrition, selectedDateKey]);

  async function addTextFoods() {
    if (!text.trim()) return;
    setLoading("food");
    setStatus({ message: "Calculando calorias...", tone: "info" });
    const parsed = parseFoodText(text);
    try {
      const enriched = await Promise.all(parsed.map((food) => (food.calories > 0 ? food : onEstimateFood(food.inputText ?? food.name))));
      setMeals((current) => [...current, ...enriched]);
      setText("");
      setStatus({ message: "Alimentos agregados. Revisa y guarda el dia.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudieron calcular los alimentos.", tone: "error" });
    } finally {
      setLoading(undefined);
    }
  }

  async function addFood(foodName: string) {
    setLoading("food");
    setStatus({ message: "Consultando alimento...", tone: "info" });
    try {
      const food = await onEstimateFood(foodName);
      setMeals((current) => [...current, { ...food, source: "autocomplete", estimated: false }]);
      setQuery("");
      setStatus({ message: "Alimento agregado.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo agregar el alimento.", tone: "error" });
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result })
        });
        const foods = (await response.json()) as FoodEntry[];
        setMeals((current) => [...current, ...foods.map((food) => ({ ...food, calculationMethod: food.calculationMethod ?? "photo", createdAt: food.createdAt ?? new Date().toISOString() }))]);
        setStatus({ message: "Imagen analizada.", tone: "success" });
      } catch {
        setStatus({ message: "No se pudo analizar la imagen.", tone: "error" });
      } finally {
        setLoading(undefined);
      }
    };
    reader.readAsDataURL(file);
  }

  function addDrink() {
    const amountMl = drinkToMl(drinkAmount, drinkUnit);
    setDrinks((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type: drinkType, amountMl, label: `${drinkAmount} ${drinkUnit}` }
    ]);
  }

  async function save(nextMeals = meals, nextPlan = planItems, nextDrinks = drinks, silent = false) {
    const nextTotals = sumMeals(nextMeals);
    let success = false;
    if (!silent) {
      setLoading("save");
      setStatus({ message: "Guardando comida...", tone: "info" });
    }
    try {
      await onSave({ ...nextTotals, waterMl: nextDrinks.filter((drink) => drink.type === "water").reduce((sum, drink) => sum + drink.amountMl, 0), weightKg: weightKg || undefined, dateKey: date, meals: nextMeals, planItems: nextPlan, drinks: nextDrinks });
      success = true;
      if (!silent) setStatus({ message: "Guardado. Dashboard e historial actualizados.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo guardar nutricion.", tone: "error" });
    } finally {
      if (!silent) setLoading(undefined);
    }
    if (success) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    }
  }

  function togglePlan(itemId: string) {
    const nextPlan = planItems.map((currentItem) => currentItem.id === itemId ? { ...currentItem, done: !currentItem.done } : currentItem);
    setPlanItems(nextPlan);
    setLoading("autosave");
    setStatus({ message: "Guardando checklist...", tone: "info" });
    void save(meals, nextPlan, drinks, true).then(() => {
      setStatus({ message: "Checklist actualizado.", tone: "success" });
      setLoading(undefined);
    });
  }

  function updateFood(food: FoodEntry) {
    const nextMeals = meals.map((meal) => meal.id === food.id ? food : meal);
    setMeals(nextMeals);
    setSelectedFood(food);
    setEditingFood(undefined);
  }

  function duplicateFood(food: FoodEntry) {
    setMeals((current) => [...current, { ...food, id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, createdAt: new Date().toISOString() }]);
  }

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">Plan, comidas extra y bebidas</p>
        <h1 className="text-3xl font-semibold">Nutricion</h1>
      </header>

      <Card>
        <SectionTitle title="Plan del dia" eyebrow="IA-ready" />
        {(["Desayuno", "Almuerzo", "Merienda", "Cena"] as const).map((meal) => (
          <div key={meal} className="mb-4 last:mb-0">
            <p className="mb-2 text-sm font-semibold">{meal}</p>
            <div className="space-y-2">
              {planItems.filter((item) => item.meal === meal).map((item) => (
                <button
                  key={item.id}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm ${item.done ? "bg-limeglass text-black" : "bg-white/[0.06] light:bg-black/[0.04]"}`}
                  onClick={() => togglePlan(item.id)}
                  disabled={loading === "autosave"}
                  type="button"
                >
                  <Check size={16} /> {item.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <SegmentedControl value={mode} onChange={setMode} options={[{ value: "text", label: "Extra" }, { value: "search", label: "Buscar" }, { value: "photo", label: "Foto" }]} />
      <Card>
        <SectionTitle title="Agregar comidas fuera del plan" eyebrow="IA si no existe" />
        {mode === "text" ? (
          <div className="grid gap-3">
            <textarea className="min-h-28 rounded-3xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="150 gramos de milanesa de pollo&#10;Cafe&#10;Alfajor" value={text} onChange={(event) => setText(event.target.value)} />
            <LoadingButton loading={loading === "food"} loadingLabel="Calculando..." className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-black" onClick={() => void addTextFoods()}><Plus size={18} /> Agregar y estimar</LoadingButton>
          </div>
        ) : null}
        {mode === "search" ? (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white/[0.08] px-4 py-3 light:bg-black/[0.05]"><Search size={18} /><input className="w-full bg-transparent outline-none" placeholder="Ban..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            {suggestions.map((food) => <button key={food.name} className="rounded-2xl bg-white/[0.06] p-3 text-left text-sm disabled:opacity-60 light:bg-black/[0.04]" disabled={loading === "food"} onClick={() => void addFood(food.name)}>{food.name}</button>)}
          </div>
        ) : null}
        {mode === "photo" ? (
          <label className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/[0.04] light:border-black/15 light:bg-black/[0.03]">
            <Camera className="mb-2 text-limeglass" /> Tomar o seleccionar foto
            <span className="mt-1 text-xs text-white/45 light:text-black/45">{loading === "photo" ? "Analizando imagen..." : "La IA estima alimentos, porciones y macros."}</span>
            <input className="hidden" type="file" accept="image/*" capture="environment" onChange={(event) => void handlePhoto(event.target.files?.[0] ?? null)} />
          </label>
        ) : null}
      </Card>

      <InlineStatus message={status.message} tone={status.tone} />

      <Card>
        <SectionTitle title="Bebidas" />
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
          <button className="grid size-10 place-items-center rounded-2xl bg-white text-black" onClick={addDrink} type="button"><Plus size={16} /></button>
        </div>
        <div className="mt-3 space-y-2">
          {drinks.map((drink) => <div key={drink.id} className="flex justify-between rounded-2xl bg-white/[0.06] px-3 py-2 text-sm light:bg-black/[0.04]"><span>{drink.type} - {drink.label}</span><span>{drink.amountMl} ml</span></div>)}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Dashboard del dia" />
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Calorias" detail="Energia total consumida durante el dia." value={`${Math.round(totals.calories)} kcal`} />
          <Metric label="Proteinas" detail="Cantidad de proteinas consumidas durante el dia." value={`${Math.round(totals.protein)} g`} />
          <Metric label="Carbohidratos" detail="Cantidad total ingerida." value={`${Math.round(totals.carbs)} g`} />
          <Metric label="Grasas" detail="Grasas totales registradas." value={`${Math.round(totals.fat)} g`} />
          <Metric label="Fibra" detail="Fibra estimada de los alimentos." value={`${Math.round(totals.fiber ?? 0)} g`} />
          <Metric label="Agua" detail="Agua registrada y convertida a ml." value={`${(waterMl / 1000).toFixed(1)} L`} />
        </div>
      </Card>

      <Card>
        <SectionTitle title="Guardar" />
        <div className="mb-3 grid grid-cols-2 gap-2">
          <input className="rounded-2xl bg-white/[0.08] px-3 py-2 outline-none light:bg-black/[0.05]" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <input className="rounded-2xl bg-white/[0.08] px-3 py-2 outline-none light:bg-black/[0.05]" type="number" placeholder="Peso" value={weightKg} onChange={(event) => setWeightKg(Number(event.target.value))} />
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
                <button onClick={() => duplicateFood(meal)} type="button" aria-label="Duplicar"><Copy size={16} /></button>
                <button onClick={() => setMeals((current) => current.filter((item) => item.id !== meal.id))} type="button" aria-label="Eliminar"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        {selectedFood ? <FoodDetail food={selectedFood} editing={editingFood?.id === selectedFood.id} onEdit={() => setEditingFood(selectedFood)} onCancel={() => setEditingFood(undefined)} onChange={setEditingFood} draft={editingFood ?? selectedFood} onSave={(food) => updateFood(food)} /> : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <LoadingButton loading={loading === "save"} loadingLabel="Guardando..." className="flex h-11 items-center justify-center gap-1 rounded-2xl bg-limeglass text-sm font-semibold text-black" onClick={() => void save()}><Save size={16} /> Guardar</LoadingButton>
          <button className="flex h-11 items-center justify-center gap-1 rounded-2xl bg-red-500/20 text-sm text-red-200 light:text-red-700" onClick={() => nutrition?.id && onDelete(nutrition.id)} type="button"><Trash2 size={16} /> Borrar dia</button>
        </div>
        {saved ? <p className="mt-3 rounded-2xl bg-limeglass/15 p-3 text-center text-sm text-limeglass light:text-black">Guardado. Dashboard e historial actualizados.</p> : null}
      </Card>
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
    ["Fecha", food.createdAt ? new Date(food.createdAt).toLocaleString("es-AR") : "-"]
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
          <button className="col-span-2 h-10 rounded-2xl bg-limeglass font-semibold text-black" onClick={() => onSave(draft)} type="button">Guardar alimento</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {rows.map(([label, value]) => <div key={label} className="rounded-2xl bg-white/[0.06] p-2 light:bg-black/[0.04]"><p className="text-[11px] text-white/40 light:text-black/40">{label}</p><p className="text-sm font-semibold">{value}</p></div>)}
        </div>
      )}
    </div>
  );
}

function Metric({ label, detail, value }: { label: string; detail: string; value: string }) {
  return <div className="rounded-2xl bg-white/[0.06] p-3 light:bg-black/[0.04]"><p className="text-xs text-white/45 light:text-black/45">{label}</p><p className="text-lg font-semibold">{value}</p><p className="mt-1 text-[11px] leading-4 text-white/40 light:text-black/40">{detail}</p></div>;
}
