import { NextResponse } from "next/server";
import { answerLocalChat } from "@/lib/chat";
import type { BodyMeasurement, NutritionLog, ProductStockSummary, Workout } from "@/types/apex";

export const runtime = "nodejs";

type ChatContext = {
  nutrition?: NutritionLog;
  stock: ProductStockSummary[];
  workouts: Workout[];
  body?: BodyMeasurement;
};

export async function POST(request: Request) {
  const body = (await request.json()) as { message?: string; context?: ChatContext };
  const message = body.message?.trim();
  const context = body.context;

  if (!message || !context) {
    return NextResponse.json({ answer: "Necesito una pregunta y contexto de APEX para responder." }, { status: 400 });
  }

  const fallback = answerLocalChat(message, context);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ answer: fallback, mode: "local" });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Sos APEX, un asistente personal premium. Responde en español rioplatense, breve y accionable. Usá sólo el contexto recibido. No inventes datos médicos; para implante/cabello, seguí indicaciones médicas como referencia de seguimiento, no reemplazo."
        },
        {
          role: "user",
          content: JSON.stringify({ pregunta: message, contexto: context })
        }
      ]
    })
  });

  if (!response.ok) {
    return NextResponse.json({ answer: fallback, mode: "local" });
  }

  const data = await response.json();
  const answer = typeof data.output_text === "string" && data.output_text.trim() ? data.output_text.trim() : fallback;
  return NextResponse.json({ answer, mode: "openai" });
}
