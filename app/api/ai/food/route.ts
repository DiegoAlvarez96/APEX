import { NextResponse } from "next/server";
import { DateTimeService } from "@/lib/date";
import { OpenAiServiceError, logOpenAi, requestOpenAiText } from "@/lib/ai/openaiService";
import { parseFoodQuery, unknownFoodEntry } from "@/lib/nutrition";
import type { FoodEntry } from "@/types/apex";

export const runtime = "nodejs";

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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logFoodAi("error", { query, code: "missing_api_key" });
    return NextResponse.json({ code: "api_error", error: "No se pudo obtener respuesta de OpenAI. Reintentá." }, { status: 503 });
  }

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
      return NextResponse.json({ code: "quota", error: "Sin crÃ©ditos en OpenAI. RevisÃ¡ el saldo de la API." }, { status: 402 });
    }
    if (error instanceof OpenAiServiceError && (error.code === "api_error" || error.code === "missing_api_key")) {
      return NextResponse.json({ code: "api_error", error: "No se pudo obtener respuesta de OpenAI. ReintentÃ¡." }, { status: 502 });
    }
    const defaultEntry = estimateDefaultManual(query);
    logOpenAi("nutrition-openai", "error", { query, code: "parse_error", message: error instanceof Error ? error.message : String(error), defaultEntry });
    return NextResponse.json(
      {
        code: "parse_error",
        error: "Error al parsear la respuesta de OpenAI.",
        question: "Â¿QuerÃ©s cargar valores por defecto?",
        defaultEntry
      },
      { status: 422 }
    );
  }

  logFoodAi("request", { query, request: openAiRequest });

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(openAiRequest)
    });
  } catch (error) {
    logFoodAi("error", { query, code: "api_error", message: formatUnknownError(error) });
    return NextResponse.json({ code: "api_error", error: "No se pudo obtener respuesta de OpenAI. Reintentá." }, { status: 502 });
  }

  const rawText = await response.text();
  logFoodAi("raw_response", { query, status: response.status, body: rawText });
  if (!response.ok) {
    const errorCode = detectOpenAiErrorCode(rawText);
    logFoodAi("error", { query, status: response.status, code: errorCode });
    if (errorCode === "quota") {
      return NextResponse.json({ code: "quota", error: "Sin créditos en OpenAI. Revisá el saldo de la API." }, { status: 402 });
    }
    return NextResponse.json({ code: "api_error", error: "No se pudo obtener respuesta de OpenAI. Reintentá." }, { status: 502 });
  }

  try {
    const data = JSON.parse(rawText) as OpenAiResponse;
    const outputText = extractOpenAiText(data);
    const entry = toFoodEntry(outputText, query);
    logFoodAi("parsed_json", { query, outputText, entry });
    logFoodAi("source_final", { query, source: entry.source, calculationMethod: entry.calculationMethod });
    return NextResponse.json(entry);
  } catch (error) {
    const defaultEntry = estimateDefaultManual(query);
    logFoodAi("error", { query, code: "parse_error", message: formatUnknownError(error), defaultEntry });
    return NextResponse.json(
      {
        code: "parse_error",
        error: "Error al parsear la respuesta de OpenAI.",
        question: "¿Querés cargar valores por defecto?",
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
  const parsed = JSON.parse(stripJsonFence(text)) as FoodLike;
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

type OpenAiResponse = {
  output_text?: string;
  output?: { content?: { text?: string }[] }[];
};

type FoodLike = Record<string, unknown>;

function extractOpenAiText(data: OpenAiResponse) {
  return data.output_text ?? data.output?.flatMap((item) => item.content ?? []).find((content) => typeof content.text === "string")?.text;
}

function stripJsonFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
}

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

function formatUnknownError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function detectOpenAiErrorCode(rawText: string) {
  try {
    const parsed = JSON.parse(rawText) as { error?: { code?: string; type?: string; message?: string } };
    const haystack = `${parsed.error?.code ?? ""} ${parsed.error?.type ?? ""} ${parsed.error?.message ?? ""}`.toLowerCase();
    if (/quota|billing|credit|insufficient/.test(haystack)) return "quota";
  } catch {
    if (/quota|billing|credit|insufficient/i.test(rawText)) return "quota";
  }
  return "api_error";
}

function logFoodAi(event: string, payload: Record<string, unknown>) {
  console.info(`[nutrition-openai:${event}]`, JSON.stringify(sanitizeForLog(payload)));
}

function sanitizeForLog(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/sk-[A-Za-z0-9_-]+/g, "sk-***").slice(0, 4000);
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitizeForLog(entry)]));
  return value;
}
