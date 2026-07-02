import type { WorkoutTemplate } from "@/types/apex";

function sets(reps: number, weight = 0, rir = 2, restSeconds = 90) {
  return Array.from({ length: 4 }, () => ({ reps, weight, rir, restSeconds, completed: false }));
}

export const defaultWorkoutTemplates: WorkoutTemplate[] = [
  {
    name: "Espalda 1 - Fuerza",
    group: "Espalda",
    focus: "Fuerza",
    intensity: 4,
    source: "default",
    createdAt: "default",
    updatedAt: "default",
    exercises: [
      { id: "tpl-back-1-1", name: "Dominadas", sets: sets(8, 0, 2, 120) },
      { id: "tpl-back-1-2", name: "Remo con barra", sets: sets(10, 40, 2, 90) },
      { id: "tpl-back-1-3", name: "Jalon al pecho", sets: sets(12, 45, 2, 75) },
      { id: "tpl-back-1-4", name: "Pullover", sets: sets(15, 20, 1, 60) }
    ]
  },
  {
    name: "Espalda 2 - Volumen",
    group: "Espalda",
    focus: "Hipertrofia",
    intensity: 3,
    source: "default",
    createdAt: "default",
    updatedAt: "default",
    exercises: [
      { id: "tpl-back-2-1", name: "Jalon neutro", sets: sets(12, 40, 2, 75) },
      { id: "tpl-back-2-2", name: "Remo sentado", sets: sets(12, 35, 2, 75) },
      { id: "tpl-back-2-3", name: "Remo unilateral", sets: sets(12, 24, 2, 75) },
      { id: "tpl-back-2-4", name: "Face pull", sets: sets(15, 15, 1, 60) }
    ]
  },
  {
    name: "Pecho 1 - Basico",
    group: "Pecho",
    focus: "Fuerza",
    intensity: 4,
    source: "default",
    createdAt: "default",
    updatedAt: "default",
    exercises: [
      { id: "tpl-chest-1-1", name: "Press banca", sets: sets(8, 60, 2, 120) },
      { id: "tpl-chest-1-2", name: "Press inclinado mancuernas", sets: sets(10, 24, 2, 90) },
      { id: "tpl-chest-1-3", name: "Aperturas", sets: sets(12, 12, 2, 60) },
      { id: "tpl-chest-1-4", name: "Fondos", sets: sets(10, 0, 2, 90) }
    ]
  },
  {
    name: "Piernas 1 - Completa",
    group: "Piernas",
    focus: "Hipertrofia",
    intensity: 4,
    source: "default",
    createdAt: "default",
    updatedAt: "default",
    exercises: [
      { id: "tpl-legs-1-1", name: "Sentadilla", sets: sets(8, 70, 2, 120) },
      { id: "tpl-legs-1-2", name: "Prensa", sets: sets(12, 120, 2, 90) },
      { id: "tpl-legs-1-3", name: "Peso muerto rumano", sets: sets(10, 60, 2, 90) },
      { id: "tpl-legs-1-4", name: "Curl femoral", sets: sets(12, 35, 2, 75) }
    ]
  },
  {
    name: "Hombros 1 - Volumen",
    group: "Hombros",
    focus: "Hipertrofia",
    intensity: 3,
    source: "default",
    createdAt: "default",
    updatedAt: "default",
    exercises: [
      { id: "tpl-shoulders-1-1", name: "Press militar", sets: sets(8, 35, 2, 120) },
      { id: "tpl-shoulders-1-2", name: "Elevaciones laterales", sets: sets(15, 8, 1, 60) },
      { id: "tpl-shoulders-1-3", name: "Pajaros", sets: sets(15, 8, 1, 60) },
      { id: "tpl-shoulders-1-4", name: "Encogimientos", sets: sets(12, 30, 2, 75) }
    ]
  }
];

export function cloneTemplateExercises(template: WorkoutTemplate) {
  return template.exercises.map((exercise, index) => ({
    ...exercise,
    id: `${Date.now()}-${index}`,
    sets: exercise.sets.map((set) => ({ ...set, completed: false })),
    completed: false
  }));
}
