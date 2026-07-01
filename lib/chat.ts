import type { BodyMeasurement, NutritionLog, ProductStockSummary, Workout } from "@/types/apex";

export function answerLocalChat(question: string, context: { nutrition?: NutritionLog; stock: ProductStockSummary[]; workouts: Workout[]; body?: BodyMeasurement }) {
  const q = question.toLowerCase();
  const critical = context.stock.find((item) => item.status !== "ok");
  if (q.includes("prote")) {
    const protein = context.nutrition?.protein ?? 0;
    return protein ? `Hoy llevas ${Math.round(protein)} g de proteina. Si tu objetivo es ganar masa muscular, revisaria que estes cerca de 1.6-2.2 g/kg.` : "Todavia no hay comidas cargadas hoy. Podes escribir alimentos o usar foto estimada.";
  }
  if (q.includes("compr") || q.includes("stock") || q.includes("termina")) {
    return critical ? `${critical.product.name} esta en ${critical.percent}% y podria durar ${critical.estimatedDaysLeft ?? "sin estimacion"} dias.` : "No veo stock critico ahora.";
  }
  if (q.includes("entren")) {
    return context.workouts[0] ? `El ultimo entrenamiento registrado es ${context.workouts[0].title}.` : "No hay entrenamientos registrados. Carga una sesion para analizar frecuencia y volumen.";
  }
  if (q.includes("fisico") || q.includes("peso")) {
    return context.body ? `Ultimo peso: ${context.body.weightKg} kg. Objetivo: ${context.body.goal}.` : "Todavia no cargaste mediciones en Mi fisico.";
  }
  return "Puedo ayudarte con nutricion, stock, entrenamiento, skincare y progreso fisico usando los datos locales de APEX.";
}
