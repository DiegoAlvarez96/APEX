import { NextResponse } from "next/server";
import { DateTimeService } from "@/lib/date";
import { OpenAiServiceError, logOpenAi, parseJsonFromOpenAi, requestOpenAiText } from "@/lib/ai/openaiService";
import type { Workout, WorkoutExercise } from "@/types/apex";

export const runtime = "nodejs";

const SYSTEM_PROMPT = [
  "Actua como entrenador y preparador fisico profesional para APEX.",
  "Genera el entrenamiento de la fecha indicada usando objetivo, progreso, historial, volumen, frecuencia, recuperacion y musculos entrenados recientemente.",
  "Evita repetir grupos musculares sin sentido y respeta dias de descanso cuando el historial lo sugiera.",
  "La respuesta debe ser una plantilla editable.",
  "Responde exclusivamente JSON valido con esta forma:",
  "{\"title\":\"Espalda\",\"focus\":\"Espalda y bisagra\",\"intensity\":4,\"durationMinutes\":70,\"notes\":\"\",\"exercises\":[{\"name\":\"Dominadas\",\"sets\":[{\"reps\":10,\"weight\":0,\"rir\":2,\"restSeconds\":120}]}]}",
  "intensity debe ser numero entero de 1 a 5."
].join(" ");

export async function POST(request: Request) {
  const body = (await request.json()) as { targetDateKey?: string; context?: unknown };
  if (!body.targetDateKey || !body.context) return NextResponse.json({ error: "Missing targetDateKey or context" }, { status: 400 });

  try {
    const { text } = await requestOpenAiText({
      logPrefix: "training-plan-openai",
      logPayload: { targetDateKey: body.targetDateKey },
      request: {
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify({ targetDateKey: body.targetDateKey, context: body.context }) }
        ]
      }
    });
    const parsed = parseJsonFromOpenAi<Partial<Workout>>(text);
    const workout = normalizeWorkout(parsed, body.targetDateKey);
    if (!workout.exercises.length) throw new Error("OpenAI returned an empty workout");
    logOpenAi("training-plan-openai", "parsed_workout", { targetDateKey: body.targetDateKey, workout });
    return NextResponse.json(workout);
  } catch (error) {
    if (error instanceof OpenAiServiceError && error.code === "quota") {
      return NextResponse.json({ code: "quota", error: "Sin creditos en OpenAI. Revisa el saldo de la API." }, { status: 402 });
    }
    const code = error instanceof OpenAiServiceError ? error.code : "parse_error";
    return NextResponse.json({ code, error: "No se pudo generar el entrenamiento con OpenAI." }, { status: code === "parse_error" ? 422 : 502 });
  }
}

function normalizeWorkout(value: Partial<Workout>, targetDateKey: string): Omit<Workout, "id"> {
  const now = DateTimeService.nowIso();
  return {
    dateKey: targetDateKey,
    title: typeof value.title === "string" && value.title.trim() ? value.title.trim() : "Entrenamiento IA",
    focus: typeof value.focus === "string" && value.focus.trim() ? value.focus.trim() : "Rutina personalizada",
    intensity: normalizeIntensity(value.intensity),
    durationMinutes: toNumber(value.durationMinutes) || undefined,
    notes: typeof value.notes === "string" ? value.notes : undefined,
    exercises: normalizeExercises(value.exercises ?? []),
    completed: false,
    createdAt: now,
    updatedAt: now
  };
}

function normalizeExercises(exercises: WorkoutExercise[]) {
  return exercises
    .filter((exercise) => typeof exercise.name === "string" && exercise.name.trim())
    .map((exercise, index) => ({
      id: DateTimeService.id(`ai-exercise-${index}`),
      name: exercise.name.trim(),
      notes: exercise.notes,
      completed: false,
      sets: (exercise.sets?.length ? exercise.sets : [{ reps: 10, weight: 0, rir: 2, restSeconds: 90 }]).map((set) => ({
        reps: toNumber(set.reps) || 10,
        weight: toNumber(set.weight),
        rir: toNumber(set.rir) || undefined,
        restSeconds: toNumber(set.restSeconds) || undefined,
        completed: false
      }))
    }));
}

function normalizeIntensity(value: unknown): Workout["intensity"] {
  const next = Math.max(1, Math.min(5, Math.round(toNumber(value) || 3)));
  return next as Workout["intensity"];
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
  return 0;
}
