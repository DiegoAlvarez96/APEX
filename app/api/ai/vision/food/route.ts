import { NextResponse } from "next/server";
import { DateTimeService } from "@/lib/date";
import { OpenAiServiceError, parseJsonFromOpenAi, requestOpenAiText } from "@/lib/ai/openaiService";
import type { FoodEntry, FoodVisionOption, FoodVisionResult } from "@/types/apex";

export const runtime = "nodejs";

const FOOD_PHOTO_SYSTEM_PROMPT = [
  "Identifica alimentos y estima porciones visibles en la foto.",
  "Responde exclusivamente con JSON valido. No incluyas markdown, explicaciones ni texto adicional.",
  "El JSON debe tener esta estructura:",
  "{\"confidence\":0.85,\"options\":[{\"label\":\"Atun en lata\",\"confidence\":0.82}],\"foods\":[{\"name\":\"Atun en lata\",\"amountLabel\":\"1 lata\",\"calories\":160,\"protein\":34,\"carbs\":0,\"fat\":2,\"fiber\":0}]}",
  "confidence debe ser un numero entre 0 y 1 que represente tu confianza general.",
  "Cada option debe tener label y confidence entre 0 y 1.",
  "Cada food debe tener name, amountLabel, calories, protein, carbs, fat y fiber.",
  "Usa numeros para calories, protein, carbs, fat y fiber. Los macros deben corresponder a la porcion estimada visible en la foto.",
  "Si hay dudas sobre el alimento o la porcion, usa confidence menor a 0.72 y devuelve entre 3 y 5 options probables.",
  "Si hay varios alimentos visibles, incluyelos como elementos separados en foods."
].join(" ");

const FOOD_PHOTO_USER_PROMPT = "Identificar comida de esta imagen. Prioriza precision. Si hay dudas sobre alimento o porcion, devuelve opciones para confirmar antes de registrar macros.";

export async function POST(request: Request) {
  const { image } = (await request.json()) as { image?: string };
  if (!image) return NextResponse.json({ error: "Missing image" }, { status: 400 });

  try {
    const { text } = await requestOpenAiText({
      logPrefix: "nutrition-vision-openai",
      logPayload: { imageBytes: image.length },
      request: {
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: FOOD_PHOTO_SYSTEM_PROMPT
        },
        { role: "user", content: [{ type: "input_text", text: FOOD_PHOTO_USER_PROMPT }, { type: "input_image", image_url: image }] }
      ]
      }
    });
    return NextResponse.json(parseVisionResult(text));
  } catch (error) {
    if (error instanceof OpenAiServiceError && error.code === "quota") {
      return NextResponse.json({ code: "quota", error: "Sin creditos en OpenAI. Revisa el saldo de la API." }, { status: 402 });
    }
    return NextResponse.json({ code: "api_error", error: "No se pudo obtener respuesta de OpenAI. Reintenta." }, { status: 502 });
  }
}

function parseVisionResult(text: string | undefined): FoodVisionResult {
  try {
    const parsed = parseJsonFromOpenAi<{ confidence?: number; options?: FoodVisionOption[]; foods?: Partial<FoodEntry>[] } | Partial<FoodEntry>[]>(text ?? "{}");
    if (Array.isArray(parsed)) return mapFoods(parsed);
    const confidence = Number(parsed.confidence ?? 0);
    const foods = mapFoods(parsed.foods ?? []);
    const options = normalizeOptions(parsed.options, foods);
    if (confidence < 0.72 || options.length > 1) {
      return {
        status: "confirm",
        message: "La imagen no tiene confianza suficiente. Confirma el alimento antes de calcular macros.",
        options,
        foods
      };
    }
    return foods.length ? foods : lowConfidenceOptions();
  } catch {
    return lowConfidenceOptions();
  }
}

function mapFoods(items: Partial<FoodEntry>[]): FoodEntry[] {
  return items.map((item, index) => ({
    id: DateTimeService.id(`photo-food-${index}`),
    name: item.name ?? "Alimento estimado",
    amountLabel: item.amountLabel,
    calories: Number(item.calories ?? 0),
    protein: Number(item.protein ?? 0),
    carbs: Number(item.carbs ?? 0),
    fat: Number(item.fat ?? 0),
    fiber: Number(item.fiber ?? 0),
    estimated: true,
    source: "photo",
    calculationMethod: "photo",
    createdAt: DateTimeService.nowIso()
  }));
}

function normalizeOptions(options: FoodVisionOption[] | undefined, foods: FoodEntry[]) {
  const base = options?.length ? options : foods.map((food) => ({ label: food.name, confidence: 0.75 }));
  const deduped = Array.from(new Map(base.map((option) => [option.label.toLowerCase(), option])).values()).slice(0, 5);
  return deduped.length
    ? deduped
    : [
        { label: "Atun en lata", confidence: 0.55 },
        { label: "Caballa", confidence: 0.45 },
        { label: "Sardinas", confidence: 0.42 },
        { label: "Pollo en conserva", confidence: 0.35 },
        { label: "Otro", confidence: 0.2 }
      ];
}

function lowConfidenceOptions(): FoodVisionResult {
  return {
    status: "confirm",
    message: "Necesito confirmacion para evitar registrar un alimento incorrecto.",
    options: normalizeOptions(undefined, []),
    foods: []
  };
}
