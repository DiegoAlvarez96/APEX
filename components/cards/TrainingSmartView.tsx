"use client";

import { Check, Copy, Dumbbell, Pencil, Plus, Replace, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { DateNavigator } from "@/components/ui/DateNavigator";
import { InlineStatus, LoadingButton } from "@/components/ui/Loading";
import { DateTimeService } from "@/lib/date";
import { assignedWorkoutTemplateForDate, cloneTemplateExercises, defaultWorkoutTemplates } from "@/lib/trainingTemplates";
import type { Workout, WorkoutExercise, WorkoutTemplate } from "@/types/apex";

export function TrainingSmartView({
  selectedDate,
  selectedDateKey,
  onSelectDate,
  workouts,
  onAddWorkout,
  onUpdateWorkout,
  onDeleteWorkout,
  onDuplicateWorkout,
  templates,
  onAddTemplate,
  onDeleteTemplate,
  onGenerateWorkout
}: {
  selectedDate: Date;
  selectedDateKey: string;
  onSelectDate: (date: Date) => void;
  workouts: Workout[];
  onAddWorkout: (workout: Omit<Workout, "id" | "createdAt">) => Promise<void> | void;
  onUpdateWorkout: (id: number, workout: Partial<Workout>) => Promise<void> | void;
  onDeleteWorkout: (id: number) => Promise<void> | void;
  onDuplicateWorkout: (workout: Workout) => Promise<void> | void;
  templates: WorkoutTemplate[];
  onAddTemplate: (template: Omit<WorkoutTemplate, "id" | "createdAt" | "updatedAt">) => Promise<void> | void;
  onDeleteTemplate: (id: number) => Promise<void> | void;
  onGenerateWorkout: (targetDateKey?: string) => Promise<Omit<Workout, "id">>;
}) {
  const allTemplates = useMemo(() => [...templates, ...defaultWorkoutTemplates], [templates]);
  const assignedTemplate = useMemo(() => assignedWorkoutTemplateForDate(selectedDate, templates), [selectedDate, templates]);
  const [editing, setEditing] = useState<Workout>();
  const [title, setTitle] = useState(assignedTemplate.group);
  const [focus, setFocus] = useState(assignedTemplate.focus);
  const [intensity, setIntensity] = useState<Workout["intensity"]>(assignedTemplate.intensity);
  const [notes, setNotes] = useState(assignedTemplate.notes ?? "");
  const [group, setGroup] = useState(assignedTemplate.group);
  const [loading, setLoading] = useState<"workout" | "template" | "ai" | "complete" | undefined>();
  const [status, setStatus] = useState<{ message?: string; tone?: "info" | "success" | "error" }>({});
  const [rawExercises, setRawExercises] = useState(templateToRaw(assignedTemplate));
  const groups = Array.from(new Set(allTemplates.map((template) => template.group)));
  const groupTemplates = allTemplates.filter((template) => template.group === group);

  useEffect(() => {
    const firstWorkout = workouts[0];
    if (firstWorkout) {
      setEditing(firstWorkout);
      setTitle(firstWorkout.title);
      setFocus(firstWorkout.focus);
      setIntensity(firstWorkout.intensity);
      setNotes(firstWorkout.notes ?? "");
      setGroup(firstWorkout.title);
      setRawExercises(firstWorkout.exercises.map(exerciseToRaw).join("\n"));
      return;
    }
    setTitle(assignedTemplate.group);
    setFocus(assignedTemplate.focus);
    setIntensity(assignedTemplate.intensity);
    setNotes(assignedTemplate.notes ?? "");
    setGroup(assignedTemplate.group);
    setRawExercises(templateToRaw(assignedTemplate));
    setEditing(undefined);
  }, [assignedTemplate, selectedDateKey, workouts]);

  function load(workout: Workout) {
    setEditing(workout);
    setTitle(workout.title);
    setFocus(workout.focus);
    setIntensity(workout.intensity);
    setNotes(workout.notes ?? "");
    setGroup(workout.title);
    setRawExercises(workout.exercises.map(exerciseToRaw).join("\n"));
  }

  function applyTemplate(template: WorkoutTemplate, notify = true) {
    setTitle(template.group);
    setFocus(template.focus);
    setIntensity(template.intensity);
    setNotes(template.notes ?? "");
    setGroup(template.group);
    setRawExercises(templateToRaw(template));
    if (notify) setStatus({ message: `${template.name} cargada para ${selectedDateKey}.`, tone: "success" });
  }

  async function submit() {
    const exercises = parseExercises(rawExercises);
    if (!title.trim() || exercises.length === 0) return;
    const payload = { dateKey: selectedDateKey, title, focus, intensity, notes, exercises, completed: exercises.every((exercise) => exercise.completed) };
    setLoading("workout");
    setStatus({ message: editing ? "Guardando cambios..." : "Guardando entrenamiento...", tone: "info" });
    try {
      if (editing?.id) await onUpdateWorkout(editing.id, payload);
      else await onAddWorkout(payload);
      setStatus({ message: "Entrenamiento guardado.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo guardar el entrenamiento.", tone: "error" });
    } finally {
      setLoading(undefined);
    }
  }

  async function generateWorkout() {
    setLoading("ai");
    setStatus({ message: "Generando entrenamiento con OpenAI...", tone: "info" });
    try {
      const workout = await onGenerateWorkout(selectedDateKey);
      setEditing(undefined);
      setTitle(workout.title);
      setFocus(workout.focus);
      setIntensity(workout.intensity);
      setNotes(workout.notes ?? "");
      setGroup(workout.title);
      setRawExercises(workout.exercises.map(exerciseToRaw).join("\n"));
      setStatus({ message: "Entrenamiento generado como plantilla editable.", tone: "success" });
    } catch {
      setStatus({ message: "No se pudo generar el entrenamiento con OpenAI.", tone: "error" });
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

  async function toggleExercise(workout: Workout, exerciseIndex: number) {
    if (!workout.id) return;
    const exercises = workout.exercises.map((item, itemIndex) => {
      if (itemIndex !== exerciseIndex) return item;
      const completed = !item.completed;
      return { ...item, completed, sets: item.sets.map((set) => ({ ...set, completed })) };
    });
    await onUpdateWorkout(workout.id, { exercises, completed: exercises.every((exercise) => exercise.completed) });
  }

  async function markWorkoutCompleted(workout: Workout) {
    if (!workout.id) return;
    setLoading("complete");
    const completed = !workout.completed;
    const exercises = workout.exercises.map((exercise) => ({ ...exercise, completed, sets: exercise.sets.map((set) => ({ ...set, completed })) }));
    try {
      await onUpdateWorkout(workout.id, { completed, exercises });
    } finally {
      setLoading(undefined);
    }
  }

  return (
    <div className="space-y-5">
      <DateNavigator title="Entrenamiento" eyebrow="Rutina del dia e historial" selectedDate={selectedDate} onSelectDate={onSelectDate} />

      <Card>
        <div className="mb-4 flex items-start justify-between gap-3">
          <SectionTitle title="Planificacion semanal" eyebrow="Agenda compartida" />
          <LoadingButton loading={loading === "ai"} loadingLabel="Generando..." className="min-h-10 rounded-2xl bg-white px-3 text-xs font-semibold text-black" onClick={() => void generateWorkout()}>Generar rutina</LoadingButton>
        </div>
        <div className="rounded-2xl bg-limeglass/15 p-4 light:bg-black/[0.04]">
          <p className="text-sm text-white/55 light:text-black/55">Asignado para {selectedDateKey}</p>
          <p className="mt-1 text-xl font-semibold">{assignedTemplate.group} - {assignedTemplate.focus}</p>
          <p className="mt-2 text-sm text-white/55 light:text-black/55">{assignedTemplate.exercises.length} ejercicios - intensidad {assignedTemplate.intensity}</p>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Plantillas" eyebrow="Cambiar rutina del dia" />
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
                {template.source === "user" && template.id ? <button type="button" onClick={() => void onDeleteTemplate(template.id!)} aria-label="Eliminar plantilla"><Trash2 size={16} /></button> : null}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title={editing ? "Editar entrenamiento del dia" : "Registrar entrenamiento del dia"} eyebrow={selectedDateKey} />
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

      <div className="space-y-3">
        {workouts.map((workout) => (
          <Card key={workout.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-white/[0.08] light:bg-black/[0.05]"><Dumbbell className="text-limeglass" size={20} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{workout.title}</p>
                    <p className="text-sm text-white/45 light:text-black/45">{workout.focus} - intensidad {workout.intensity} - {workout.exercises.length} ejercicios</p>
                  </div>
                  <LoadingButton loading={loading === "complete"} loadingLabel="" className={`grid size-9 place-items-center rounded-xl ${workout.completed ? "bg-limeglass text-black" : "bg-white/[0.08]"}`} onClick={() => void markWorkoutCompleted(workout)}>
                    <Check size={16} />
                  </LoadingButton>
                </div>
                <div className="mt-3 space-y-2 text-sm text-white/65 light:text-black/65">
                  {workout.exercises.map((exercise, index) => (
                    <button key={exercise.id} className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left ${exercise.completed ? "bg-limeglass text-black" : "bg-white/[0.05] light:bg-black/[0.04]"}`} onClick={() => void toggleExercise(workout, index)} type="button">
                      <span>{exercise.name} - {exercise.sets.length} series - {exercise.sets[0]?.reps ?? 0} reps - {exercise.sets[0]?.weight ?? 0} kg - RIR {exercise.sets[0]?.rir ?? "-"} - {exercise.sets[0]?.restSeconds ?? 0}s</span>
                      <Check size={16} />
                    </button>
                  ))}
                </div>
                {workout.notes ? <p className="mt-3 rounded-2xl bg-white/[0.05] p-3 text-sm text-white/55 light:bg-black/[0.04] light:text-black/55">{workout.notes}</p> : null}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Action icon={Pencil} label="Editar" onClick={() => load(workout)} />
              <Action icon={Copy} label="Duplicar" onClick={() => void onDuplicateWorkout(workout)} />
              <Action icon={Trash2} label="Eliminar" onClick={() => workout.id && void onDeleteWorkout(workout.id)} />
            </div>
          </Card>
        ))}
        {workouts.length === 0 ? (
          <Card className="p-4">
            <div className="flex items-center gap-3 text-sm text-white/55 light:text-black/55">
              <Replace className="text-limeglass" size={18} />
              La plantilla asignada ya esta cargada arriba para registrar este dia.
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function templateToRaw(template: WorkoutTemplate) {
  return cloneTemplateExercises(template).map(exerciseToRaw).join("\n");
}

function exerciseToRaw(exercise: WorkoutExercise) {
  return `${exercise.name} ${exercise.sets.length}x${exercise.sets[0]?.reps ?? 10}x${exercise.sets[0]?.weight ?? 0} rir${exercise.sets[0]?.rir ?? 2} rest${exercise.sets[0]?.restSeconds ?? 90}`;
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
    return { id: DateTimeService.id(`exercise-${index}`), name, completed: false, sets: Array.from({ length: sets }, () => ({ reps, weight, rir, restSeconds, completed: false })) };
  });
}
