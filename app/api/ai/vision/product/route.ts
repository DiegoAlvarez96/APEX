import { NextResponse } from "next/server";
import { parseJsonFromOpenAi, requestOpenAiText } from "@/lib/ai/openaiService";
import { productTemplates } from "@/lib/shopping";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { image } = (await request.json()) as { image?: string };
  if (!image) return NextResponse.json({ error: "Missing image" }, { status: 400 });

  const fallback = { ...productTemplates["Proteina ENA Whey"], image };
  try {
    const { text } = await requestOpenAiText({
      logPrefix: "product-vision-openai",
      logPayload: { imageBytes: image.length },
      request: {
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: "Identifica un producto de stock desde una foto. Responde solo JSON con commercialName, name, brand, category, group, size, initialStock, unit, recommendedConsumption, dailyConsumptionEstimate." },
        { role: "user", content: [{ type: "input_text", text: "Autocompletar producto." }, { type: "input_image", image_url: image }] }
      ]
      }
    });
    return NextResponse.json({ ...parseJsonFromOpenAi<Record<string, unknown>>(text), image });
  } catch {
    return NextResponse.json(fallback);
  }
}
