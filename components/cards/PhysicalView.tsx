"use client";

import { Camera, Save } from "lucide-react";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import type { BodyMeasurement } from "@/types/apex";

const fields = [
  { key: "weightKg", label: "Peso actual", help: "Peso corporal actual en kilogramos." },
  { key: "heightCm", label: "Altura", help: "Altura en centimetros." },
  { key: "age", label: "Edad", help: "Edad actual para contextualizar recomendaciones." },
  { key: "bodyFatPercent", label: "Porcentaje graso", help: "Estimacion del porcentaje de grasa corporal." },
  { key: "chestCm", label: "Pecho", help: "Contorno del pecho en centimetros." },
  { key: "waistCm", label: "Cintura", help: "Circunferencia de la cintura." },
  { key: "armsCm", label: "Brazos", help: "Contorno del brazo relajado o flexionado, pero siempre medido igual." },
  { key: "legsCm", label: "Piernas", help: "Contorno de muslo en centimetros." },
  { key: "neckCm", label: "Cuello", help: "Contorno del cuello en centimetros." }
] as const;

export function PhysicalView({ latest, measurements, onSave }: { latest?: BodyMeasurement; measurements: BodyMeasurement[]; onSave: (value: Omit<BodyMeasurement, "id" | "dateKey" | "createdAt">) => void }) {
  const [value, setValue] = useState({
    weightKg: latest?.weightKg ?? 0,
    heightCm: latest?.heightCm ?? 0,
    age: latest?.age ?? 0,
    goal: latest?.goal ?? "Ganar masa muscular",
    bodyFatPercent: latest?.bodyFatPercent ?? 0,
    chestCm: latest?.chestCm ?? 0,
    waistCm: latest?.waistCm ?? 0,
    armsCm: latest?.armsCm ?? 0,
    legsCm: latest?.legsCm ?? 0,
    neckCm: latest?.neckCm ?? 0
  });
  const [photo, setPhoto] = useState<string | undefined>(latest?.photo);

  async function handlePhoto(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2"><p className="text-sm text-white/45 light:text-black/45">Progreso corporal</p><h1 className="text-3xl font-semibold">Mi fisico</h1></header>
      <Card>
        <SectionTitle title="Medicion" eyebrow="IA-ready" />
        <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-3xl border border-dashed border-white/20 p-3 light:border-black/15">
          <div className="grid size-20 place-items-center overflow-hidden rounded-2xl bg-white/[0.08]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="size-full object-cover" />
            ) : <Camera />}
          </div>
          <span className="text-sm">Foto de progreso</span>
          <input className="hidden" type="file" accept="image/*" onChange={(event) => void handlePhoto(event.target.files?.[0] ?? null)} />
        </label>
        <label className="mb-3 block rounded-2xl bg-white/[0.08] px-4 py-3 light:bg-black/[0.05]">
          <span className="text-sm font-semibold">Objetivo</span>
          <input className="mt-1 w-full bg-transparent outline-none" value={value.goal} onChange={(event) => setValue((current) => ({ ...current, goal: event.target.value }))} />
          <span className="mt-1 block text-xs text-white/40 light:text-black/40">Meta fisica que deseas alcanzar.</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((field) => (
            <label key={field.key} className="rounded-2xl bg-white/[0.08] px-4 py-3 light:bg-black/[0.05]">
              <span className="text-sm font-semibold">{field.label}</span>
              <input className="mt-1 w-full bg-transparent text-lg outline-none" type="number" value={Number(value[field.key])} onChange={(event) => setValue((current) => ({ ...current, [field.key]: Number(event.target.value) }))} />
              <span className="mt-1 block text-[11px] leading-4 text-white/40 light:text-black/40">{field.help}</span>
            </label>
          ))}
        </div>
        <button className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-limeglass font-semibold text-black" onClick={() => onSave({ ...value, photo })} type="button"><Save size={18} /> Guardar medicion</button>
      </Card>
      <Card><SectionTitle title="Historial" />{measurements.map((m) => <div key={m.id} className="mb-2 rounded-2xl bg-white/[0.06] p-3 text-sm light:bg-black/[0.04]">{m.dateKey} - {m.weightKg} kg - cintura {m.waistCm ?? "-"} cm</div>)}</Card>
    </div>
  );
}
