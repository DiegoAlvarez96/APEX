import { NextResponse } from "next/server";
import { DateTimeService } from "@/lib/date";
import { OpenAiServiceError, logOpenAi, parseJsonFromOpenAi, requestOpenAiText } from "@/lib/ai/openaiService";
import type { NutritionPlanItem } from "@/types/apex";

export const runtime = "nodejs";

const SYSTEM_PROMPT = [
  "Actua como nutricionista profesional para APEX.",
  "Genera un plan nutricional personalizado para la fecha indicada usando el contexto reciente del usuario.",
  "Prioriza calidad, variedad diaria, objetivo fisico, historial nutricional, progreso, suplementos, habitos y restricciones si existen.",
  "No repitas automaticamente el menu de dias anteriores salvo que tenga sentido.",
  "Regla obligatoria: cada item debe incluir amountLabel con cantidad exacta o estimada.",
  "Para alimentos simples, amountLabel debe indicar cantidad y unidad, por ejemplo: 1 banana mediana (120 g), 35 g, 180 g cocidos, 250 ml.",
  "Para comidas compuestas, amountLabel debe resumir la porcion total y components debe desglosar cada parte con gramos, ml o unidades.",
  "Ejemplos de components: claras 3 unidades, huevo entero 1 unidad, espinaca 50 g, arroz cocido 180 g, pechuga de pollo 170 g, aceite de oliva 10 ml.",
  "No devuelvas comidas compuestas sin components. Si una cantidad es estimada, igual indicarla claramente.",
  "Responde exclusivamente JSON valido con esta forma:",
  "{\"items\":[{\"meal\":\"Desayuno\",\"name\":\"Omelette con tostadas\",\"amountLabel\":\"1 plato\",\"components\":[{\"name\":\"Claras\",\"amountLabel\":\"3 unidades\"},{\"name\":\"Huevo entero\",\"amountLabel\":\"1 unidad\"},{\"name\":\"Espinaca\",\"amountLabel\":\"50 g\"},{\"name\":\"Pan integral\",\"amountLabel\":\"2 rebanadas (60 g)\"}],\"calories\":430,\"protein\":34,\"carbs\":38,\"fat\":15,\"fiber\":7,\"notes\":\"\"}]}",
  "meal solo puede ser: Desayuno, Colacion manana, Almuerzo, Merienda, Colacion tarde, Cena.",
  "Inclui colaciones solo si corresponden.",
  "Los macros deben ser por item completo y para la porcion recomendada, sumando todos sus components cuando existan."
].join(" ");

export async function POST(request: Request) {
  const body = (await request.json()) as { targetDateKey?: string; context?: unknown };
  if (!body.targetDateKey || !body.context) return NextResponse.json({ error: "Missing targetDateKey or context" }, { status: 400 });

  try {
    const { text } = await requestOpenAiText({
      logPrefix: "nutrition-plan-openai",
      logPayload: { targetDateKey: body.targetDateKey },
      request: {
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify({ targetDateKey: body.targetDateKey, context: body.context }) }
        ]
      }
    });
    const parsed = parseJsonFromOpenAi<{ items?: Partial<NutritionPlanItem>[] }>(text);
    const items = normalizePlanItems(parsed.items ?? []);
    if (!items.length) throw new Error("OpenAI returned an empty plan");
    logOpenAi("nutrition-plan-openai", "parsed_plan", { targetDateKey: body.targetDateKey, items });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof OpenAiServiceError && error.code === "quota") {
      return NextResponse.json({ code: "quota", error: "Sin creditos en OpenAI. Revisa el saldo de la API." }, { status: 402 });
    }
    const code = error instanceof OpenAiServiceError ? error.code : "parse_error";
    return NextResponse.json({ code, error: "No se pudo generar el plan nutricional con OpenAI." }, { status: code === "parse_error" ? 422 : 502 });
  }
}

function normalizePlanItems(items: Partial<NutritionPlanItem>[]): NutritionPlanItem[] {
  const allowedMeals = new Set(["Desayuno", "Colacion manana", "Almuerzo", "Merienda", "Colacion tarde", "Cena"]);
  return items
    .filter((item) => typeof item.name === "string" && item.name.trim())
    .map((item, index) => ({
      id: DateTimeService.id(`ai-plan-${index}`),
      meal: allowedMeals.has(String(item.meal)) ? item.meal! : "Almuerzo",
      name: item.name!.trim(),
      amountLabel: normalizeAmountLabel(item.amountLabel),
      components: normalizeComponents(item.components),
      done: false,
      calories: toNumber(item.calories),
      protein: toNumber(item.protein),
      carbs: toNumber(item.carbs),
      fat: toNumber(item.fat),
      fiber: toNumber(item.fiber),
      notes: typeof item.notes === "string" ? item.notes : undefined
    }));
}

function normalizeAmountLabel(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeComponents(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const components = value
    .map((component) => {
      if (!component || typeof component !== "object") return undefined;
      const record = component as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const amountLabel = typeof record.amountLabel === "string" ? record.amountLabel.trim() : "";
      return name && amountLabel ? { name, amountLabel } : undefined;
    })
    .filter((component): component is { name: string; amountLabel: string } => Boolean(component));
  return components.length ? components : undefined;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
  return 0;
}
