import { NextResponse } from "next/server";
import { productTemplates } from "@/lib/shopping";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { image } = (await request.json()) as { image?: string };
  if (!image) return NextResponse.json({ error: "Missing image" }, { status: 400 });

  const fallback = { ...productTemplates["Proteina ENA Whey"], image };
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(fallback);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: "Identifica un producto de stock desde una foto. Responde solo JSON con commercialName, name, brand, category, group, size, initialStock, unit, recommendedConsumption, dailyConsumptionEstimate." },
        { role: "user", content: [{ type: "input_text", text: "Autocompletar producto." }, { type: "input_image", image_url: image }] }
      ]
    })
  });

  if (!response.ok) return NextResponse.json(fallback);
  const data = await response.json();
  try {
    return NextResponse.json({ ...JSON.parse(data.output_text ?? "{}"), image });
  } catch {
    return NextResponse.json(fallback);
  }
}
