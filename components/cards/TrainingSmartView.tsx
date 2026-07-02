"use client";

import { Check, Copy, Dumbbell, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { InlineStatus, LoadingButton } from "@/components/ui/Loading";
import { cloneTemplateExercises, defaultWorkoutTemplates } from "@/lib/trainingTemplates";
import type { Workout, WorkoutExercise, WorkoutTemplate } from "@/types/apex";

export function TrainingSmartView({
  workouts,
  onAddWorkout,
  onUpdateWorkout,
  onDeleteWorkout,
  onDuplicateWorkout,
  templates,
  onAddTemplate,
  onDeleteTemplate
}: {
  workouts: Workout[];
  onAddWorkout: (workout: Omit<Workout, "id" | "dateKey" | "createdAt">) => Promise<void> | void;
  onUpdateWorkout: (id: number, workout: Partial<Workout>) => Promise<void> | void;
  onDeleteWorkout: (id: number) => Promise<void> | void;
  onDuplicateWorkout: (workout: Workout) => Promise<void> | void;
  templates: WorkoutTemplate[];
  onAddTemplate: (template: Omit<WorkoutTemplate, "id" | "createdAt" | "updatedAt">) => Promise<void> | void;
  onDeleteTemplate: (id: number) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState<Workout>();
  const [title, setTitle] = useState("Espalda");
  const [focus, setFocus] = useState("Fuerza");
  const [intensity, setIntensity] = useState<Workout["intensity"]>(4);
  const [notes, setNotes] = useState("");
  const [group, setGroup] = useState("Espalda");
  const [loading, setLoading] = useState<"workout" | "template" | undefined>();
  const [status, setStatus] = useState<{ message?: string; tone?: "info" | "success" | "error" }>({});
  const [rawExercises, setRawExercises] = useState("Dominadas 4x10x0 rir2 rest90\nRemo con barra 4x12x40 rir2 rest90\nJalon al pecho 4x10x45 rir2 rest75\nPullover 3x15x20 rir1 rest60\nPeso muerto 4x8x80 rir2 rest120");
  const allTemplates = useMemo(() => [...templates, ...defaultWorkoutTemplates], [templates]);
  const groups = Array.from(new Set(allTemplates.map((template) => template.group)));
  const groupTemplates = allTemplates.filter((template) => template.group === group);
  const preview = parseExercises(rawExercises);

  function load(workout: Workout) {
    setEditing(workout);
    setTitle(workout.title);
    setFocus(workout.focus);
    setIntensity(workout.intensity);
    setNotes(workout.notes ?? "");
    setRawExercises(workout.exercises.map((exercise) => `${exercise.name} ${exercise.sets.length}x${exercise.sets[0]?.reps ?? 10}x${exercise.sets[0]?.weight ?? 0} rir${exercise.sets[0]?.rir ?? 2} rest${exercise.sets[0]?.restSeconds ?? 90}`).join("\n"));
  }

  function applyTemplate(template: WorkoutTemplate) {
    setTitle(template.group);
    setFocus(template.focus);
    setIntensity(template.intensity);
    setNotes(template.notes ?? "");
    setRawExercises(templateToRaw(template));
    setStatus({ message: `${template.name} cargada. Podes editar antes de guardar.`, tone: "success" });
  }

  async function submit() {
    const exercises = parseExercises(rawExercises);
    if (!title.trim() || exercises.length === 0) return;
    const payload = { title, focus, intensity, notes, exercises };
    setLoading("workout");
    setStatus({ message: editing ? "Guardando cambios..." : "Guardando entrenamiento...", tone: "info" });
    try {
      if (editing?.id) await onUpdateWorkout(editing.id, payload);
      else await onAddWorkout(payload);
      setEditing(undefined);
      setStatus({ message: "Entrenamiento guardado.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo guardar el entrenamiento.", tone: "error" });
    } finally {
      setLoading(undefined);
    }
  }

  async function saveTemplate() {
    const exercises = parseExercises(rawExercises);
    if (!title.trim() || exercises.length === 0) return;
    setLoading("template");
    setStatus({ message: "Guardando plantilla...", tone: "info" });
    try {
      await onAddTemplate({ name: `${title} personalizada`, group: title, focus, intensity, notes, exercises, source: "user" });
      setStatus({ message: "Plantilla guardada.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo guardar la plantilla.", tone: "error" });
    } finally {
      setLoading(undefined);
    }
  }

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2"><p className="text-sm text-white/45 light:text-black/45">Diario de gimnasio</p><h1 className="text-3xl font-semibold">Entrenamiento</h1></header>
      <Card>
        <SectionTitle title="Plantillas" eyebrow="Carga rapida" />
        <div className="grid gap-3">
          <select className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={group} onChange={(event) => setGroup(event.target.value)}>
            {groups.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <div className="grid gap-2">
            {groupTemplates.map((template) => (
              <div key={`${template.source}-${template.id ?? template.name}`} className="flex items-center justify-between gap-2 rounded-2xl bg-white/[0.06] p-3 text-sm light:bg-black/[0.04]">
                <button className="min-w-0 flex-1 text-left" type="button" onClick={() => applyTemplate(template)}>
                  <span className="block font-semibold">{template.name}</span>
                  <span className="text-xs text-white/45 light:text-black/45">{template.focus} - {template.exercises.length} ejercicios</span>
                </button>
                {template.source === "user" && template.id ? <button type="button" onClick={() => void onDeleteTemplate(template.id!)}><Trash2 size={16} /></button> : null}
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <SectionTitle title={editing ? "Editar sesion" : "Registrar sesion"} eyebrow="Peso, reps, RIR y descanso" />
        <div className="grid gap-3">
          <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={title} onChange={(event) => setTitle(event.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={focus} onChange={(event) => setFocus(event.target.value)} />
            <select className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={intensity} onChange={(event) => setIntensity(Number(event.target.value) as Workout["intensity"])}>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Intensidad {value}</option>)}
            </select>
          </div>
          <textarea className="min-h-36 rounded-3xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={rawExercises} onChange={(event) => setRawExercises(event.target.value)} />
          <p className="text-xs leading-5 text-white/45 light:text-black/45">Formato: ejercicio series x reps x peso, RIR opcional y descanso. Ejemplo: Remo 4x12x40 rir2 rest90.</p>
          <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" placeholder="Observaciones" value={notes} onChange={(event) => setNotes(event.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <LoadingButton loading={loading === "workout"} loadingLabel="Guardando..." className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-limeglass font-semibold text-black" onClick={() => void submit()}><Plus size={18} /> {editing ? "Guardar cambios" : "Guardar entrenamiento"}</LoadingButton>
            <LoadingButton loading={loading === "template"} loadingLabel="Guardando..." className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-black" onClick={() => void saveTemplate()}><Copy size={18} /> Guardar plantilla</LoadingButton>
          </div>
          <InlineStatus message={status.message} tone={status.tone} />
        </div>
      </Card>
      <Card>
        <SectionTitle title="Rutina diaria" eyebrow="Checklist" />
        <div className="space-y-2">
          {preview.map((exercise) => (
            <div key={exercise.id} className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-3 text-sm light:bg-black/[0.04]">
              <span>{exercise.name} - {exercise.sets.length}x{exercise.sets[0]?.reps} - {exercise.sets[0]?.weight ?? 0} kg</span>
              <Check className="text-white/35 light:text-black/35" size={17} />
            </div>
          ))}
        </div>
      </Card>
      <div className="space-y-3">
        {workouts.map((workout) => (
          <Card key={workout.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-white/[0.08] light:bg-black/[0.05]"><Dumbbell className="text-limeglass" size={20} /></div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{workout.title}</p>
                <p className="text-sm text-white/45 light:text-black/45">{workout.focus} - intensidad {workout.intensity} - {workout.exercises.length} ejercicios</p>
                <div className="mt-3 space-y-2 text-sm text-white/65 light:text-black/65">
                  {workout.exercises.map((exercise, index) => (
                    <button key={exercise.id} className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left ${exercise.completed ? "bg-limeglass text-black" : "bg-white/[0.05] light:bg-black/[0.04]"}`} onClick={() => workout.id && onUpdateWorkout(workout.id, { exercises: workout.exercises.map((item, itemIndex) => itemIndex === index ? { ...item, completed: !item.completed, sets: item.sets.map((set) => ({ ...set, completed: !item.completed })) } : item) })} type="button">
                      <span>{exercise.name} - {exercise.sets.length} series - {exercise.sets[0]?.reps ?? 0} reps - {exercise.sets[0]?.weight ?? 0} kg - RIR {exercise.sets[0]?.rir ?? "-"} - {exercise.sets[0]?.restSeconds ?? 0}s</span>
                      <Check size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Action icon={Pencil} label="Editar" onClick={() => load(workout)} />
              <Action icon={Copy} label="Duplicar" onClick={() => onDuplicateWorkout(workout)} />
              <Action icon={Trash2} label="Eliminar" onClick={() => workout.id && onDeleteWorkout(workout.id)} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function templateToRaw(template: WorkoutTemplate) {
  return cloneTemplateExercises(template).map((exercise) => `${exercise.name} ${exercise.sets.length}x${exercise.sets[0]?.reps ?? 10}x${exercise.sets[0]?.weight ?? 0} rir${exercise.sets[0]?.rir ?? 2} rest${exercise.sets[0]?.restSeconds ?? 90}`).join("\n");
}

function Action({ icon: Icon, label, onClick }: { icon: typeof Pencil; label: string; onClick: () => void }) {
  return <button className="flex h-10 items-center justify-center gap-1 rounded-2xl bg-white/[0.08] text-xs light:bg-black/[0.05]" onClick={onClick} type="button"><Icon size={14} />{label}</button>;
}

function parseExercises(value: string): WorkoutExercise[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const match = line.match(/^(.*?)(\d+)x(\d+)(?:x(\d+(?:\.\d+)?))?(?:\s+rir(\d+))?(?:\s+rest(\d+))?$/i);
    const name = match?.[1].trim() || line;
    const sets = Number(match?.[2] ?? 1);
    const reps = Number(match?.[3] ?? 10);
    const weight = Number(match?.[4] ?? 0);
    const rir = match?.[5] ? Number(match[5]) : undefined;
    const restSeconds = match?.[6] ? Number(match[6]) : undefined;
    return { id: `${Date.now()}-${index}`, name, completed: false, sets: Array.from({ length: sets }, () => ({ reps, weight, rir, restSeconds, completed: false })) };
  });
}
