"use client";

import { Dumbbell, Plus } from "lucide-react";
import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import type { Workout, WorkoutExercise } from "@/types/apex";

export function TrainingView({
  workouts,
  onAddWorkout
}: {
  workouts: Workout[];
  onAddWorkout: (workout: Omit<Workout, "id" | "dateKey" | "createdAt">) => void;
}) {
  const [title, setTitle] = useState("Espalda");
  const [focus, setFocus] = useState("Fuerza");
  const [intensity, setIntensity] = useState<Workout["intensity"]>(4);
  const [rawExercises, setRawExercises] = useState("Dominadas 4x10\nRemo 4x12\nPullover 3x15\nPeso muerto 4x8");

  function submit() {
    const exercises = parseExercises(rawExercises);
    if (!title.trim() || exercises.length === 0) return;
    onAddWorkout({ title, focus, intensity, exercises });
  }

  return (
    <div className="space-y-5">
      <header className="px-1 pt-2">
        <p className="text-sm text-white/45 light:text-black/45">Historial y volumen</p>
        <h1 className="text-3xl font-semibold">Entrenamiento</h1>
      </header>

      <Card>
        <SectionTitle title="Registrar sesion" eyebrow="Strong-style" />
        <div className="grid gap-3">
          <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={title} onChange={(event) => setTitle(event.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={focus} onChange={(event) => setFocus(event.target.value)} />
            <select className="rounded-2xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={intensity} onChange={(event) => setIntensity(Number(event.target.value) as Workout["intensity"])}>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Intensidad {value}</option>)}
            </select>
          </div>
          <textarea className="min-h-36 rounded-3xl bg-white/[0.08] px-4 py-3 outline-none light:bg-black/[0.05]" value={rawExercises} onChange={(event) => setRawExercises(event.target.value)} />
          <button className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-limeglass font-semibold text-black" onClick={submit} type="button">
            <Plus size={18} /> Guardar entrenamiento
          </button>
        </div>
      </Card>

      <div className="space-y-3">
        {workouts.map((workout) => (
          <Card key={workout.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-white/[0.08] light:bg-black/[0.05]">
                <Dumbbell className="text-limeglass" size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{workout.title}</p>
                <p className="text-sm text-white/45 light:text-black/45">{workout.focus} · intensidad {workout.intensity} · {workout.exercises.length} ejercicios</p>
                <div className="mt-3 space-y-1 text-sm text-white/65 light:text-black/65">
                  {workout.exercises.map((exercise) => (
                    <p key={exercise.id}>{exercise.name} · {exercise.sets.length} series · {exercise.sets.map((set) => set.reps).join("/")}</p>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function parseExercises(value: string): WorkoutExercise[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^(.*?)(\d+)x(\d+)$/i);
      const name = match?.[1].trim() || line;
      const sets = Number(match?.[2] ?? 1);
      const reps = Number(match?.[3] ?? 10);
      return {
        id: `${Date.now()}-${index}`,
        name,
        sets: Array.from({ length: sets }, () => ({ reps }))
      };
    });
}
