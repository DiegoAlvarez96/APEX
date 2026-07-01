import { formatSleepDuration } from "@/lib/sleep";
import type { BodyMeasurement, NutritionLog, ProductStockSummary, SleepLog, Workout } from "@/types/apex";

export function answerLocalChat(question: string, context: { nutrition?: NutritionLog; stock: ProductStockSummary[]; workouts: Workout[]; body?: BodyMeasurement; sleep?: SleepLog }) {
  const q = normalize(question);
  const critical = context.stock.find((item) => item.status !== "ok");
  if (q.includes("prote") || q.includes("macro") || q.includes("comida") || q.includes("nutri")) {
    const protein = context.nutrition?.protein ?? 0;
    return protein ? `Hoy llevas ${Math.round(protein)} g de proteina. Si tu objetivo es ganar masa muscular, revisaria que estes cerca de 1.6-2.2 g/kg.` : "Todavia no hay comidas cargadas hoy. Podes escribir alimentos o usar foto estimada.";
  }
  const asksStock =
    q.includes("compr") ||
    q.includes("stock") ||
    q.includes("termina") ||
    q.includes("falta") ||
    q.includes("agot") ||
    q.includes("dura") ||
    q.includes("queda") ||
    q.includes("creatina") ||
    q.includes("whey") ||
    q.includes("proteina") ||
    q.includes("omega") ||
    q.includes("shampoo");
  if (asksStock) {
    const requested = context.stock.find((item) => {
      const productText = normalize(`${item.product.name} ${item.product.commercialName ?? ""} ${item.product.brand ?? ""} ${item.product.category}`);
      return q.split(/\s+/).some((token) => token.length > 3 && productText.includes(token));
    });
    const target = requested ?? critical;
    if (target) return `${target.product.name} esta en ${target.percent}% y podria durar ${target.estimatedDaysLeft ?? "sin estimacion"} dias.`;
    return "Todavia no hay stock cargado para ese producto. Si lo agregas con cantidad inicial y consumo diario, APEX calcula dias restantes y fecha aproximada de compra.";
  }
  if (q.includes("entren") || q.includes("rutina") || q.includes("gimnasio") || q.includes("volumen")) {
    return context.workouts[0] ? `El ultimo entrenamiento registrado es ${context.workouts[0].title}.` : "No hay entrenamientos registrados. Carga una sesion para analizar frecuencia y volumen.";
  }
  if (q.includes("fisico") || q.includes("peso") || q.includes("medida") || q.includes("progreso")) {
    return context.body ? `Ultimo peso: ${context.body.weightKg} kg. Objetivo: ${context.body.goal}.` : "Todavia no cargaste mediciones en Mi fisico.";
  }
  if (q.includes("sueno") || q.includes("dormi") || q.includes("descanso")) {
    return context.sleep ? `Ultimo sueno registrado: ${formatSleepDuration(context.sleep.durationMinutes)} (${context.sleep.sleepTime} a ${context.sleep.wakeTime}).` : "Todavia no hay sueno cargado para el dia seleccionado.";
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
