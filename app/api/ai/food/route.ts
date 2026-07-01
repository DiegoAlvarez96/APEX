import { NextResponse } from "next/server";
import { findFoodPreset, unknownFoodEntry } from "@/lib/nutrition";
import type { FoodEntry } from "@/types/apex";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { text } = (await request.json()) as { text?: string };
  const query = text?.trim() ?? "";
  if (!query) return NextResponse.json({ error: "Missing food text" }, { status: 400 });

  const preset = findFoodPreset(query);
  if (preset) {
    return NextResponse.json({
      id: `${Date.now()}-${query}`,
      name: query,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
      fiber: preset.fiber,
      estimated: false,
      source: "text"
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
        { role: "system", content: "Estima macros de un alimento. Responde solo JSON valido con name, calories, protein, carbs, fat, fiber." },
        { role: "user", content: query }
      ]
    })
  });

  if (!response.ok) return NextResponse.json(estimateFallback(query));
  const data = await response.json();
  return NextResponse.json(toFoodEntry(data.output_text, query));
}

function estimateFallback(query: string): FoodEntry {
  const entry = unknownFoodEntry(query);
  return { ...entry, calories: 180, protein: 12, carbs: 18, fat: 7, fiber: 2 };
}

function toFoodEntry(text: string | undefined, fallbackName: string): FoodEntry {
  try {
    const parsed = JSON.parse(text ?? "{}") as Partial<FoodEntry>;
    return {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: parsed.name ?? fallbackName,
      calories: Number(parsed.calories ?? 0),
      protein: Number(parsed.protein ?? 0),
      carbs: Number(parsed.carbs ?? 0),
      fat: Number(parsed.fat ?? 0),
      fiber: Number(parsed.fiber ?? 0),
      estimated: true,
      source: "text"
    };
  } catch {
    return estimateFallback(fallbackName);
  }
}
