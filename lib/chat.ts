import type { BodyMeasurement, NutritionLog, ProductStockSummary, Workout } from "@/types/apex";

export function answerLocalChat(question: string, context: { nutrition?: NutritionLog; stock: ProductStockSummary[]; workouts: Workout[]; body?: BodyMeasurement }) {
  const q = normalize(question);
  const critical = context.stock.find((item) => item.status !== "ok");
  if (q.includes("prote") || q.includes("macro") || q.includes("comida") || q.includes("nutri")) {
    const protein = context.nutrition?.protein ?? 0;
    return protein ? `Hoy llevas ${Math.round(protein)} g de proteina. Si tu objetivo es ganar masa muscular, revisaria que estes cerca de 1.6-2.2 g/kg.` : "Todavia no hay comidas cargadas hoy. Podes escribir alimentos o usar foto estimada.";
  }
  if (q.includes("compr") || q.includes("stock") || q.includes("termina") || q.includes("falta") || q.includes("agot")) {
    return critical ? `${critical.product.name} esta en ${critical.percent}% y podria durar ${critical.estimatedDaysLeft ?? "sin estimacion"} dias.` : "No veo stock critico ahora.";
  }
  if (q.includes("entren") || q.includes("rutina") || q.includes("gimnasio") || q.includes("volumen")) {
    return context.workouts[0] ? `El ultimo entrenamiento registrado es ${context.workouts[0].title}.` : "No hay entrenamientos registrados. Carga una sesion para analizar frecuencia y volumen.";
  }
  if (q.includes("fisico") || q.includes("peso") || q.includes("medida") || q.includes("progreso")) {
    return context.body ? `Ultimo peso: ${context.body.weightKg} kg. Objetivo: ${context.body.goal}.` : "Todavia no cargaste mediciones en Mi fisico.";
  }
  if (q.includes("skincare") || q.includes("piel") || q.includes("barba") || q.includes("cabello")) {
    return "Para skincare puedo cruzar tu rutina del dia, fotos y productos cargados. Hoy revisaria cumplir limpieza, hidratacion y protector solar si corresponde.";
  }
  if (q.includes("mejor") || q.includes("recom") || q.includes("objetivo")) {
    const protein = context.nutrition?.protein ?? 0;
    if (protein > 0 && protein < 120) return "La mejora mas clara hoy seria subir proteina y sostener agua. Tambien registra entrenamiento para poder analizar volumen.";
    if (critical) return `La prioridad seria reponer ${critical.product.name}, porque esta en ${critical.percent}% de stock.`;
    return "La mejora principal es cargar comidas, entrenamiento y una medicion fisica reciente para que APEX tenga contexto suficiente.";
  }
  return "Puedo ayudarte con nutricion, stock, entrenamiento, skincare y progreso fisico usando los datos locales de APEX.";
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
