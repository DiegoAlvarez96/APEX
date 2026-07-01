import { NextResponse } from "next/server";
import { estimatePhotoFoods } from "@/lib/nutrition";
import type { FoodEntry } from "@/types/apex";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { image } = (await request.json()) as { image?: string };
  if (!image) return NextResponse.json({ error: "Missing image" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(estimatePhotoFoods());

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: "Identifica alimentos y porciones de una foto. Responde solo JSON array de objetos con name, amountLabel, calories, protein, carbs, fat, fiber." },
        { role: "user", content: [{ type: "input_text", text: "Estimar comida de esta imagen." }, { type: "input_image", image_url: image }] }
      ]
    })
  });

  if (!response.ok) return NextResponse.json(estimatePhotoFoods());
  const data = await response.json();
  return NextResponse.json(parseFoods(data.output_text));
}

function parseFoods(text: string | undefined): FoodEntry[] {
  try {
    const parsed = JSON.parse(text ?? "[]") as Partial<FoodEntry>[];
    return parsed.map((item, index) => ({
      id: `${Date.now()}-${index}`,
      name: item.name ?? "Alimento estimado",
      amountLabel: item.amountLabel,
      calories: Number(item.calories ?? 0),
      protein: Number(item.protein ?? 0),
      carbs: Number(item.carbs ?? 0),
      fat: Number(item.fat ?? 0),
      fiber: Number(item.fiber ?? 0),
      estimated: true,
      source: "photo"
    }));
  } catch {
    return estimatePhotoFoods();
  }
}
