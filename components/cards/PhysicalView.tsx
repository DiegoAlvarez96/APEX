"use client";

import { Camera, Eye, Pencil, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { DateNavigator } from "@/components/ui/DateNavigator";
import { InlineStatus, LoadingButton } from "@/components/ui/Loading";
import { dateKey } from "@/lib/date";
import type { BodyMeasurement } from "@/types/apex";

type MeasurementForm = Omit<BodyMeasurement, "id" | "dateKey" | "createdAt">;

const fields = [
  { key: "weightKg", label: "Peso actual", help: "Peso corporal actual en kilogramos." },
  { key: "heightCm", label: "Altura", help: "Altura en centimetros." },
  { key: "age", label: "Edad", help: "Edad actual para contextualizar recomendaciones." },
  { key: "bodyFatPercent", label: "Porcentaje graso", help: "Estimacion del porcentaje de grasa corporal." },
  { key: "chestCm", label: "Pecho", help: "Contorno del pecho en centimetros." },
  { key: "waistCm", label: "Cintura", help: "Circunferencia de la cintura." },
  { key: "armsCm", label: "Brazos", help: "Contorno del brazo medido siempre igual." },
  { key: "legsCm", label: "Piernas", help: "Contorno de muslo en centimetros." },
  { key: "neckCm", label: "Cuello", help: "Contorno del cuello en centimetros." }
] as const;

export function PhysicalView({
  latest,
  selectedDate,
  onSelectDate,
  measurements,
  onSave,
  onUpdate,
  onDelete
}: {
  latest?: BodyMeasurement;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  measurements: BodyMeasurement[];
  onSave: (value: MeasurementForm) => Promise<void> | void;
  onUpdate: (id: number, value: Partial<BodyMeasurement>) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState<BodyMeasurement>();
  const [selected, setSelected] = useState<BodyMeasurement>();
  const [status, setStatus] = useState<{ message?: string; tone?: "info" | "success" | "error" }>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number>();
  const [value, setValue] = useState<MeasurementForm>(emptyMeasurement(latest));
  const selectedDateKey = dateKey(selectedDate);
  const dayMeasurements = measurements.filter((measurement) => measurement.dateKey === selectedDateKey);

  useEffect(() => {
    if (!editing) setValue(emptyMeasurement(latest));
  }, [editing, latest]);

  function load(measurement: BodyMeasurement) {
    setEditing(measurement);
    setSelected(measurement);
    setValue({
      weightKg: measurement.weightKg,
      heightCm: measurement.heightCm ?? 0,
      age: measurement.age ?? 0,
      goal: measurement.goal,
      bodyFatPercent: measurement.bodyFatPercent ?? 0,
      chestCm: measurement.chestCm ?? 0,
      waistCm: measurement.waistCm ?? 0,
      armsCm: measurement.armsCm ?? 0,
      legsCm: measurement.legsCm ?? 0,
      neckCm: measurement.neckCm ?? 0,
      photo: measurement.photo,
      notes: measurement.notes ?? ""
    });
  }

  async function handlePhoto(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setValue((current) => ({ ...current, photo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    setStatus({ message: editing ? "Guardando cambios..." : "Guardando medicion...", tone: "info" });
    try {
      if (editing?.id) await onUpdate(editing.id, cleanMeasurement(value));
      else await onSave(cleanMeasurement(value));
      setEditing(undefined);
      setStatus({ message: "Medicion guardada.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo guardar la medicion.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function remove(measurement: BodyMeasurement) {
    if (!measurement.id) return;
    setDeletingId(measurement.id);
    setStatus({ message: "Eliminando medicion...", tone: "info" });
    try {
      await onDelete(measurement.id);
      if (selected?.id === measurement.id) setSelected(undefined);
      if (editing?.id === measurement.id) setEditing(undefined);
      setStatus({ message: "Medicion eliminada.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo eliminar la medicion.", tone: "error" });
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <div className="space-y-5">
      <DateNavigator title="Mi fisico" eyebrow="Progreso corporal" selectedDate={selectedDate} onSelectDate={onSelectDate} />
      <Card>
        <SectionTitle title={editing ? "Editar medicion" : "Medicion"} eyebrow="IA-ready" />
        <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-3xl border border-dashed border-white/20 p-3 light:border-black/15">
          <div className="grid size-20 place-items-center overflow-hidden rounded-2xl bg-white/[0.08]">
            {value.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.photo} alt="" className="size-full object-cover" />
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
              <input className="mt-1 w-full bg-transparent text-lg outline-none" type="number" value={Number(value[field.key] ?? 0)} onChange={(event) => setValue((current) => ({ ...current, [field.key]: Number(event.target.value) }))} />
              <span className="mt-1 block text-[11px] leading-4 text-white/40 light:text-black/40">{field.help}</span>
            </label>
          ))}
        </div>
        <textarea className="mt-3 min-h-24 w-full rounded-3xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Notas de la medicion" value={value.notes ?? ""} onChange={(event) => setValue((current) => ({ ...current, notes: event.target.value }))} />
        <LoadingButton loading={saving} loadingLabel="Guardando..." className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-limeglass font-semibold text-black" onClick={() => void save()}>
          <Save size={18} /> {editing ? "Guardar cambios" : "Guardar medicion"}
        </LoadingButton>
        {editing ? <button className="mt-2 h-10 w-full rounded-2xl bg-white/[0.08] text-sm light:bg-black/[0.05]" type="button" onClick={() => setEditing(undefined)}>Cancelar edicion</button> : null}
        <div className="mt-3"><InlineStatus message={status.message} tone={status.tone} /></div>
      </Card>

      {selected ? <MeasurementDetail measurement={selected} /> : null}

      {dayMeasurements.length ? (
        <Card>
          <SectionTitle title="Mediciones de este dia" eyebrow={selectedDateKey} />
          <div className="space-y-2">
            {dayMeasurements.map((measurement) => <MeasurementRow key={measurement.id} measurement={measurement} onSelect={setSelected} onEdit={load} onDelete={(item) => void remove(item)} deleting={deletingId === measurement.id} />)}
          </div>
        </Card>
      ) : null}

      <Card>
        <SectionTitle title="Historial completo" />
        <div className="space-y-2">
          {measurements.map((measurement) => (
            <MeasurementRow key={measurement.id} measurement={measurement} onSelect={setSelected} onEdit={load} onDelete={(item) => void remove(item)} deleting={deletingId === measurement.id} />
          ))}
          {measurements.length === 0 ? <p className="text-sm text-white/45 light:text-black/45">Sin mediciones guardadas.</p> : null}
        </div>
      </Card>
    </div>
  );
}

function MeasurementRow({
  measurement,
  onSelect,
  onEdit,
  onDelete,
  deleting
}: {
  measurement: BodyMeasurement;
  onSelect: (measurement: BodyMeasurement) => void;
  onEdit: (measurement: BodyMeasurement) => void;
  onDelete: (measurement: BodyMeasurement) => void;
  deleting: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.06] p-3 text-sm light:bg-black/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{measurement.dateKey}</p>
          <p className="text-white/45 light:text-black/45">{measurement.weightKg} kg - cintura {measurement.waistCm ?? "-"} cm</p>
        </div>
        <div className="flex gap-2">
          <button className="grid size-9 place-items-center rounded-xl bg-white/[0.08]" onClick={() => onSelect(measurement)} type="button" aria-label="Ver detalle"><Eye size={15} /></button>
          <button className="grid size-9 place-items-center rounded-xl bg-white/[0.08]" onClick={() => onEdit(measurement)} type="button" aria-label="Editar"><Pencil size={15} /></button>
          <LoadingButton loading={deleting} loadingLabel="" className="grid size-9 place-items-center rounded-xl bg-red-500/15 text-red-200 light:text-red-700" onClick={() => onDelete(measurement)}>
            <Trash2 size={15} />
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}

function MeasurementDetail({ measurement }: { measurement: BodyMeasurement }) {
  const rows = [
    ["Fecha", measurement.dateKey],
    ["Peso", `${measurement.weightKg} kg`],
    ["Altura", measurement.heightCm ? `${measurement.heightCm} cm` : "-"],
    ["Edad", measurement.age ? `${measurement.age}` : "-"],
    ["Objetivo", measurement.goal],
    ["Grasa", measurement.bodyFatPercent ? `${measurement.bodyFatPercent}%` : "-"],
    ["Pecho", measurement.chestCm ? `${measurement.chestCm} cm` : "-"],
    ["Cintura", measurement.waistCm ? `${measurement.waistCm} cm` : "-"],
    ["Brazos", measurement.armsCm ? `${measurement.armsCm} cm` : "-"],
    ["Piernas", measurement.legsCm ? `${measurement.legsCm} cm` : "-"],
    ["Cuello", measurement.neckCm ? `${measurement.neckCm} cm` : "-"],
    ["Notas", measurement.notes || "-"]
  ];
  return (
    <Card>
      <SectionTitle title="Detalle completo" eyebrow={measurement.dateKey} />
      {measurement.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={measurement.photo} alt="Foto de progreso" className="mb-3 h-48 w-full rounded-3xl object-cover" />
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        {rows.map(([label, value]) => <div key={label} className="rounded-2xl bg-white/[0.06] p-3 light:bg-black/[0.04]"><p className="text-[11px] text-white/40 light:text-black/40">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>)}
      </div>
    </Card>
  );
}

function emptyMeasurement(latest?: BodyMeasurement): MeasurementForm {
  return {
    weightKg: latest?.weightKg ?? 0,
    heightCm: latest?.heightCm ?? 0,
    age: latest?.age ?? 0,
    goal: latest?.goal ?? "Ganar masa muscular",
    bodyFatPercent: latest?.bodyFatPercent ?? 0,
    chestCm: latest?.chestCm ?? 0,
    waistCm: latest?.waistCm ?? 0,
    armsCm: latest?.armsCm ?? 0,
    legsCm: latest?.legsCm ?? 0,
    neckCm: latest?.neckCm ?? 0,
    photo: latest?.photo,
    notes: latest?.notes ?? ""
  };
}

function cleanMeasurement(value: MeasurementForm): MeasurementForm {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, entry === 0 && key !== "weightKg" ? undefined : entry])) as MeasurementForm;
}
