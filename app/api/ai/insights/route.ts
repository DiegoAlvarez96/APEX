import { NextResponse } from "next/server";
import { parseJsonFromOpenAi, requestOpenAiText } from "@/lib/ai/openaiService";
import { LocalInsightProvider, type ApexAiContext, type ApexAiRecommendation } from "@/lib/ai/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json()) as { context?: ApexAiContext; model?: string };
  const context = body.context;

  if (!context) {
    return NextResponse.json([], { status: 400 });
  }

  try {
    const { text } = await requestOpenAiText({
      logPrefix: "insights-openai",
      request: {
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
      }
    });
    const parsed = parseRecommendations(text);
    return NextResponse.json(parsed);
  } catch {
    const local = await new LocalInsightProvider().analyze(context);
    return NextResponse.json(local);
  }
}

function parseRecommendations(value: string): ApexAiRecommendation[] {
  try {
    const parsed = parseJsonFromOpenAi<ApexAiRecommendation[]>(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
