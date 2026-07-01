import { getRoutineForDate } from "@/lib/routines";
import type { ProductStockSummary, Workout } from "@/types/apex";

export function buildAgendaDetail(date: Date, workouts: Workout[], stock: ProductStockSummary[]) {
  const routine = getRoutineForDate(date);
  return {
    routine: workouts.length ? workouts.map((workout) => workout.title) : ["Rutina APEX"],
    morning: routine.tasks.filter((task) => task.slot === "morning").map((task) => task.label),
    night: routine.tasks.filter((task) => task.slot === "night").map((task) => task.label),
    supplements: stock
      .filter((summary) => /creatina|omega|vitamina|minoxidil|prote/i.test(`${summary.product.name} ${summary.product.category}`))
      .slice(0, 5)
      .map((summary) => summary.product.name),
    habits: ["3 litros de agua", "Dormir 8 horas"],
    notes: routine.weekday === 4 ? ["Dermaroller 0.5 mm"] : []
  };
}
