"use client";

import { Camera, Copy, Plus, Save, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { dateKey } from "@/lib/date";
import { estimatePhotoFoods, parseFoodText, suggestFoods, sumMeals } from "@/lib/nutrition";
import type { FoodEntry, NutritionLog } from "@/types/apex";

type Mode = "text" | "search" | "photo";

export function NutritionSmartView({
  nutrition,
  onSave,
  onDelete,
  onDuplicate
}: {
  nutrition?: NutritionLog;
  onSave: (values: Omit<NutritionLog, "id" | "createdAt" | "updatedAt">) => void;
  onDelete: (id: number) => void;
  onDuplicate: (log: NutritionLog) => void;
}) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(nutrition?.dateKey ?? dateKey());
  const [waterMl, setWaterMl] = useState(nutrition?.waterMl ?? 0);
  const [weightKg, setWeightKg] = useState(nutrition?.weightKg ?? 0);
  const [meals, setMeals] = useState<FoodEntry[]>(nutrition?.meals ?? []);
  const totals = useMemo(() => sumMeals(meals), [meals]);
  const suggestions = suggestFoods(query);

  function addTextFoods() {
    setMeals((current) => [...current, ...parseFoodText(text)]);
    setText("");
  }

  function addFood(foodName: string) {
    setMeals((current) => [...current, ...parseFoodText(foodName).map((food) => ({ ...food, source: "autocomplete" as const, estimated: false }))]);
    setQuery("");
  }

  function addPhotoEstimate() {
    setMeals((current) => [...current, ...estimatePhotoFoods()]);
  }

  function save() {
    onSave({ ...totals, waterMl, weightKg: weightKg || undefined, dateKey: date });
  }

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">Comidas automaticas</p>
        <h1 className="text-3xl font-semibold">Nutricion</h1>
      </header>
      <SegmentedControl value={mode} onChange={setMode} options={[{ value: "text", label: "Texto" }, { value: "search", label: "Buscar" }, { value: "photo", label: "Foto" }]} />
      <Card>
        <SectionTitle title="Registrar comida" eyebrow="Macros estimados" />
        {mode === "text" ? (
          <div className="grid gap-3">
            <textarea className="min-h-28 rounded-3xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Banana&#10;Pollo&#10;Arroz" value={text} onChange={(event) => setText(event.target.value)} />
            <button className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-black" type="button" onClick={addTextFoods}><Plus size={18} /> Agregar alimentos</button>
          </div>
        ) : null}
        {mode === "search" ? (
          <div className="grid gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white/[0.08] px-4 py-3 light:bg-black/[0.05]"><Search size={18} /><input className="w-full bg-transparent outline-none" placeholder="Ban..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            {suggestions.map((food) => <button key={food.name} className="rounded-2xl bg-white/[0.06] p-3 text-left text-sm light:bg-black/[0.04]" onClick={() => addFood(food.name)}>{food.name}</button>)}
          </div>
        ) : null}
        {mode === "photo" ? (
          <button className="flex min-h-28 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-white/[0.04] light:border-black/15 light:bg-black/[0.03]" type="button" onClick={addPhotoEstimate}>
            <Camera className="mb-2 text-limeglass" /> Estimar alimentos por foto
            <span className="mt-1 text-xs text-white/45 light:text-black/45">Valores estimados, editables luego.</span>
          </button>
        ) : null}
      </Card>
      <Card>
        <SectionTitle title="Dashboard del dia" />
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Calorias" detail="Energia total consumida durante el dia." value={`${Math.round(totals.calories)} kcal`} />
          <Metric label="Proteinas" detail="Cantidad de proteinas consumidas durante el dia." value={`${Math.round(totals.protein)} g`} />
          <Metric label="Carbohidratos" detail="Cantidad total ingerida." value={`${Math.round(totals.carbs)} g`} />
          <Metric label="Grasas" detail="Grasas totales registradas." value={`${Math.round(totals.fat)} g`} />
          <Metric label="Fibra" detail="Fibra estimada de los alimentos." value={`${Math.round(totals.fiber ?? 0)} g`} />
          <Metric label="Agua" detail="Agua cargada manualmente." value={`${(waterMl / 1000).toFixed(1)} L`} />
        </div>
      </Card>
      <Card>
        <SectionTitle title="Ajustes y alimentos" />
        <div className="mb-3 grid grid-cols-3 gap-2">
          <input className="rounded-2xl bg-white/[0.08] px-3 py-2 outline-none light:bg-black/[0.05]" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <input className="rounded-2xl bg-white/[0.08] px-3 py-2 outline-none light:bg-black/[0.05]" type="number" placeholder="Agua ml" value={waterMl} onChange={(event) => setWaterMl(Number(event.target.value))} />
          <input className="rounded-2xl bg-white/[0.08] px-3 py-2 outline-none light:bg-black/[0.05]" type="number" placeholder="Peso" value={weightKg} onChange={(event) => setWeightKg(Number(event.target.value))} />
        </div>
        <div className="space-y-2">
          {meals.map((meal) => (
            <div key={meal.id} className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-3 text-sm light:bg-black/[0.04]">
              <span>{meal.name} {meal.estimated ? <em className="text-white/40 light:text-black/40">(estimado)</em> : null}</span>
              <button onClick={() => setMeals((current) => current.filter((item) => item.id !== meal.id))} type="button" aria-label="Eliminar"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="flex h-11 items-center justify-center gap-1 rounded-2xl bg-limeglass text-sm font-semibold text-black" onClick={save} type="button"><Save size={16} /> Guardar</button>
          <button className="flex h-11 items-center justify-center gap-1 rounded-2xl bg-white/[0.08] text-sm light:bg-black/[0.05]" onClick={() => nutrition && onDuplicate(nutrition)} type="button"><Copy size={16} /> Duplicar</button>
          <button className="flex h-11 items-center justify-center gap-1 rounded-2xl bg-red-500/20 text-sm text-red-200 light:text-red-700" onClick={() => nutrition?.id && onDelete(nutrition.id)} type="button"><Trash2 size={16} /> Borrar</button>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, detail, value }: { label: string; detail: string; value: string }) {
  return <div className="rounded-2xl bg-white/[0.06] p-3 light:bg-black/[0.04]"><p className="text-xs text-white/45 light:text-black/45">{label}</p><p className="text-lg font-semibold">{value}</p><p className="mt-1 text-[11px] leading-4 text-white/40 light:text-black/40">{detail}</p></div>;
}
