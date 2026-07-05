"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, SectionTitle } from "@/components/ui/Card";
import type { NutritionLog } from "@/types/apex";

const schema = z.object({
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  waterMl: z.coerce.number().min(0),
  weightKg: z.coerce.number().min(0).optional()
});

type NutritionForm = z.infer<typeof schema>;

export function NutritionView({
  nutrition,
  onSave
}: {
  nutrition?: NutritionLog;
  onSave: (values: Omit<NutritionLog, "id" | "dateKey" | "createdAt" | "updatedAt">) => void;
}) {
  const { register, handleSubmit, reset } = useForm<NutritionForm>({
    resolver: zodResolver(schema),
    defaultValues: { calories: 0, protein: 0, carbs: 0, fat: 0, waterMl: 0 }
  });

  useEffect(() => {
    reset({
      calories: nutrition?.calories ?? 0,
      protein: nutrition?.protein ?? 0,
      carbs: nutrition?.carbs ?? 0,
      fat: nutrition?.fat ?? 0,
      waterMl: nutrition?.waterMl ?? 0,
      weightKg: nutrition?.weightKg
    });
  }, [nutrition, reset]);

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">Macros y agua</p>
        <h1 className="text-3xl font-semibold">Nutricion</h1>
      </header>
      <Card>
        <SectionTitle title="Hoy" eyebrow="MyFitnessPal-style" />
        <form className="grid gap-3" onSubmit={handleSubmit(onSave)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calorias" name="calories" register={register} />
            <Field label="Peso kg" name="weightKg" register={register} />
            <Field label="Proteina g" name="protein" register={register} />
            <Field label="Carbos g" name="carbs" register={register} />
            <Field label="Grasas g" name="fat" register={register} />
            <Field label="Agua ml" name="waterMl" register={register} />
          </div>
          <button className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--module-accent))] font-semibold text-[rgb(var(--bg))]" type="submit">
            <Save size={18} /> Guardar dia
          </button>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, name, register }: { label: string; name: keyof NutritionForm; register: ReturnType<typeof useForm<NutritionForm>>["register"] }) {
  return (
    <label className="rounded-2xl bg-white/[0.08] px-4 py-3 light:bg-black/[0.05]">
      <span className="block text-xs text-white/45 light:text-black/45">{label}</span>
      <input className="mt-1 w-full bg-transparent text-lg font-semibold outline-none" type="number" step="0.1" {...register(name)} />
    </label>
  );
}
