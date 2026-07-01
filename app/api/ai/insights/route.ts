import { NextResponse } from "next/server";
import { LocalInsightProvider, type ApexAiContext, type ApexAiRecommendation } from "@/lib/ai/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { context?: ApexAiContext; model?: string };
  const context = body.context;

  if (!context) {
    return NextResponse.json([], { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const local = await new LocalInsightProvider().analyze(context);
    return NextResponse.json(local);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: body.model ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "Sos APEX, un asistente personal breve para nutricion, entrenamiento, stock y habitos. Responde solo JSON valido."
        },
        {
          role: "user",
          content: JSON.stringify({
            schema: "Array<{title:string,detail:string,category:'nutrition'|'training'|'stock'|'habit'}>",
            context
          })
        }
      ]
    })
  });

  if (!response.ok) {
    const local = await new LocalInsightProvider().analyze(context);
    return NextResponse.json(local);
  }

  const data = await response.json();
  const text = typeof data.output_text === "string" ? data.output_text : "[]";
  const parsed = parseRecommendations(text);
  return NextResponse.json(parsed);
}

function parseRecommendations(value: string): ApexAiRecommendation[] {
  try {
    const parsed = JSON.parse(value) as ApexAiRecommendation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
