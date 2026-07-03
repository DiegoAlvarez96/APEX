import { NextResponse } from "next/server";
import { DateTimeService } from "@/lib/date";
import { OpenAiServiceError, logOpenAi, parseJsonFromOpenAi, requestOpenAiText } from "@/lib/ai/openaiService";
import { parseFoodQuery, unknownFoodEntry } from "@/lib/nutrition";
import type { FoodEntry } from "@/types/apex";

export const runtime = "nodejs";
export const maxDuration = 60;

const FOOD_TEXT_SYSTEM_PROMPT = [
  "Estima los macros del alimento indicado por el usuario usando la cantidad y unidad recibidas.",
  "Responde exclusivamente con JSON valido. No incluyas markdown, explicaciones ni texto adicional.",
  "El JSON debe tener exactamente estas claves: name, amountLabel, calories, protein, carbs, fat, fiber.",
  "Usa numeros para calories, protein, carbs, fat y fiber. Los macros deben corresponder a la porcion indicada, no a 100 g salvo que la porcion sea 100 g.",
  "Si la cantidad o unidad es ambigua, estima una porcion razonable y reflejala en amountLabel.",
  "Ejemplo de respuesta valida: {\"name\":\"Pechuga de pollo\",\"amountLabel\":\"150 g\",\"calories\":248,\"protein\":46.5,\"carbs\":0,\"fat\":5.4,\"fiber\":0}"
].join(" ");

export async function POST(request: Request) {
  const { text } = (await request.json()) as { text?: string };
  const query = text?.trim() ?? "";
  if (!query) return NextResponse.json({ error: "Missing food text" }, { status: 400 });

  const parsedQuery = parseFoodQuery(query);
  const openAiRequest = {
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: FOOD_TEXT_SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify({ original: query, alimento: parsedQuery.name, cantidad: parsedQuery.amount, unidad: parsedQuery.unit }) }
    ]
  };

  try {
    const { text: outputText } = await requestOpenAiText({ request: openAiRequest, logPrefix: "nutrition-openai", logPayload: { query } });
    const entry = toFoodEntry(outputText, query);
    logOpenAi("nutrition-openai", "parsed_json", { query, outputText, entry });
    logOpenAi("nutrition-openai", "source_final", { query, source: entry.source, calculationMethod: entry.calculationMethod });
    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof OpenAiServiceError && error.code === "quota") {
      return NextResponse.json({ code: "quota", error: "Sin creditos en OpenAI. Revisa el saldo de la API." }, { status: 402 });
    }
    if (error instanceof OpenAiServiceError && (error.code === "api_error" || error.code === "missing_api_key")) {
      return NextResponse.json({ code: "api_error", error: "No se pudo obtener respuesta de OpenAI. Reintenta." }, { status: 502 });
    }
    const defaultEntry = estimateDefaultManual(query);
    logOpenAi("nutrition-openai", "error", { query, code: "parse_error", message: error instanceof Error ? error.message : String(error), defaultEntry });
    return NextResponse.json(
      {
        code: "parse_error",
        error: "Error al parsear la respuesta de OpenAI.",
        question: "Queres cargar valores por defecto?",
        defaultEntry
      },
      { status: 422 }
    );
  }
}

function estimateDefaultManual(query: string): FoodEntry {
  const entry = unknownFoodEntry(query);
  const text = query.toLowerCase();
  const amount = entry.amount ?? 1;
  const scale = entry.unit === "l" ? amount * 10 : entry.unit === "ml" ? amount / 100 : entry.unit === "un" ? amount : amount / 100;
  const base = /pollo|carne|hamburguesa|atun|huevo/.test(text)
    ? { calories: 210, protein: 23, carbs: 2, fat: 12, fiber: 0 }
    : /fideo|pasta|arroz|avena|pan|papa/.test(text)
      ? { calories: 160, protein: 5, carbs: 31, fat: 2, fiber: 2 }
      : /banana|manzana|pera|fruta|verdura|ensalada/.test(text)
        ? { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.5 }
        : /leche|yogur|queso/.test(text)
          ? { calories: 95, protein: 6, carbs: 7, fat: 4, fiber: 0 }
          : { calories: 140, protein: 6, carbs: 16, fat: 6, fiber: 2 };
  return {
    ...entry,
    source: "default_manual_confirmed",
    calories: Math.round(base.calories * scale),
    protein: Number((base.protein * scale).toFixed(1)),
    carbs: Number((base.carbs * scale).toFixed(1)),
    fat: Number((base.fat * scale).toFixed(1)),
    fiber: Number((base.fiber * scale).toFixed(1)),
    calculationMethod: "fallback"
  };
}

function toFoodEntry(text: string | undefined, fallbackName: string): FoodEntry {
  if (!text) throw new Error("OpenAI response text is empty");
  const parsed = parseJsonFromOpenAi<FoodLike>(text);
  const calories = numericField(parsed, ["calories", "kcal", "calorias"]);
  const protein = numericField(parsed, ["protein", "proteins", "proteina", "proteinas"]);
  const carbs = numericField(parsed, ["carbs", "carbohydrates", "carbohidratos", "hidratos"]);
  const fat = numericField(parsed, ["fat", "grasas", "grasa"]);
  const fiber = numericField(parsed, ["fiber", "fibra"]);
  if (!hasValidMacros({ calories, protein, carbs, fat, fiber })) throw new Error("OpenAI response has invalid nutritional values");
  const parsedFallback = parseFoodQuery(fallbackName);
  return {
    id: DateTimeService.id("food"),
    name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : fallbackName,
    inputText: fallbackName,
    amount: parsedFallback.amount,
    unit: parsedFallback.unit,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    estimated: true,
    source: "text",
    amountLabel: typeof parsed.amountLabel === "string" ? parsed.amountLabel : parsedFallback.amountLabel,
    calculationMethod: "openai",
    createdAt: DateTimeService.nowIso()
  };
}

type FoodLike = Record<string, unknown>;

function numericField(parsed: FoodLike, keys: string[]) {
  for (const key of keys) {
    const value = parsed[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  }
  return 0;
}

function hasValidMacros(values: Pick<FoodEntry, "calories" | "protein" | "carbs" | "fat" | "fiber">) {
  return values.calories > 0 && values.protein >= 0 && values.carbs >= 0 && values.fat >= 0 && values.fiber >= 0 && values.protein + values.carbs + values.fat + values.fiber > 0;
}
