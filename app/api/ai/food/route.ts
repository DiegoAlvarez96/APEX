import { NextResponse } from "next/server";
import { findFoodPreset, parseFoodQuery, unknownFoodEntry } from "@/lib/nutrition";
import type { FoodEntry } from "@/types/apex";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { text } = (await request.json()) as { text?: string };
  const query = text?.trim() ?? "";
  if (!query) return NextResponse.json({ error: "Missing food text" }, { status: 400 });

  const preset = findFoodPreset(query);
  const parsedQuery = parseFoodQuery(query);
  if (preset) {
    return NextResponse.json({
      id: `${Date.now()}-${query}`,
      name: query,
      inputText: query,
      amount: parsedQuery.amount,
      unit: parsedQuery.unit,
      amountLabel: parsedQuery.amountLabel,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
      fiber: preset.fiber,
      estimated: false,
      source: "text",
      calculationMethod: "database",
      createdAt: new Date().toISOString()
    } satisfies FoodEntry);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(estimateFallback(query));

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: "Estima macros de un alimento segun cantidad y unidad. Responde solo JSON valido con name, amountLabel, calories, protein, carbs, fat, fiber." },
        { role: "user", content: JSON.stringify({ original: query, alimento: parsedQuery.name, cantidad: parsedQuery.amount, unidad: parsedQuery.unit }) }
      ]
    })
  });

  if (!response.ok) return NextResponse.json(estimateFallback(query));
  const data = await response.json();
  return NextResponse.json(toFoodEntry(data.output_text, query));
}

function estimateFallback(query: string): FoodEntry {
  const entry = unknownFoodEntry(query);
  const text = query.toLowerCase();
  const amount = entry.amount ?? 100;
  const scale = entry.unit === "l" ? amount * 10 : entry.unit === "ml" ? amount / 100 : amount / 100;
  const base = /pollo|carne|hamburguesa|atun|huevo/.test(text)
    ? { calories: 210, protein: 23, carbs: 2, fat: 12, fiber: 0 }
    : /fideo|pasta|arroz|avena|pan|papa/.test(text)
      ? { calories: 160, protein: 5, carbs: 31, fat: 2, fiber: 2 }
      : /banana|manzana|fruta|verdura|ensalada/.test(text)
        ? { calories: 80, protein: 1, carbs: 18, fat: 0.5, fiber: 3 }
        : /leche|yogur|queso/.test(text)
          ? { calories: 95, protein: 6, carbs: 7, fat: 4, fiber: 0 }
          : { calories: 140, protein: 6, carbs: 16, fat: 6, fiber: 2 };
  return {
    ...entry,
    calories: Math.round(base.calories * scale),
    protein: Number((base.protein * scale).toFixed(1)),
    carbs: Number((base.carbs * scale).toFixed(1)),
    fat: Number((base.fat * scale).toFixed(1)),
    fiber: Number((base.fiber * scale).toFixed(1)),
    calculationMethod: "fallback"
  };
}

function toFoodEntry(text: string | undefined, fallbackName: string): FoodEntry {
  try {
    const parsed = JSON.parse(text ?? "{}") as Partial<FoodEntry>;
    return {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: parsed.name ?? fallbackName,
      inputText: fallbackName,
      amount: parseFoodQuery(fallbackName).amount,
      unit: parseFoodQuery(fallbackName).unit,
      calories: Number(parsed.calories ?? 0),
      protein: Number(parsed.protein ?? 0),
      carbs: Number(parsed.carbs ?? 0),
      fat: Number(parsed.fat ?? 0),
      fiber: Number(parsed.fiber ?? 0),
      estimated: true,
      source: "text",
      amountLabel: parsed.amountLabel ?? parseFoodQuery(fallbackName).amountLabel,
      calculationMethod: "openai",
      createdAt: new Date().toISOString()
    };
  } catch {
    return estimateFallback(fallbackName);
  }
}
