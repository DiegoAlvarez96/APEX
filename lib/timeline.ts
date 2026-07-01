import { dateKey } from "@/lib/date";
import type { ApexAlert, NutritionLog, ProductConsumption, ProductStockSummary, TaskCompletion, TimelineEvent, Workout } from "@/types/apex";

export function buildTimeline({
  completions,
  consumptions,
  nutritionLogs,
  workouts,
  alerts,
  stock
}: {
  completions: TaskCompletion[];
  consumptions: ProductConsumption[];
  nutritionLogs: NutritionLog[];
  workouts: Workout[];
  alerts: ApexAlert[];
  stock: ProductStockSummary[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  completions.filter((item) => item.done).forEach((item) => {
    events.push({ id: `routine-${item.id}`, dateKey: item.dateKey, title: "Rutina completada", detail: item.taskId, type: "routine" });
  });
  workouts.forEach((workout) => {
    events.push({ id: `workout-${workout.id}`, dateKey: workout.dateKey, title: workout.title, detail: `${workout.focus} · ${workout.exercises.length} ejercicios`, type: "training" });
  });
  nutritionLogs.forEach((log) => {
    events.push({ id: `nutrition-${log.id}`, dateKey: log.dateKey, title: `${Math.round(log.calories)} kcal`, detail: `${Math.round(log.protein)}P ${Math.round(log.carbs)}C ${Math.round(log.fat)}G · ${Math.round(log.waterMl / 1000)} L agua`, type: "nutrition" });
  });
  consumptions.forEach((item) => {
    const product = stock.find((summary) => summary.product.id === item.productId)?.product;
    events.push({ id: `consumption-${item.id}`, dateKey: item.dateKey, title: product ? `${product.name} registrado` : "Consumo registrado", detail: `${item.amount} ${product?.unit ?? ""}`, type: "stock" });
  });
  alerts.filter((alert) => alert.status === "buy").forEach((alert) => {
    events.push({ id: `alert-${alert.id}`, dateKey: alert.updatedAt.slice(0, 10) || dateKey(), title: "Compra marcada", detail: alert.title, type: "stock" });
  });
  return events.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
