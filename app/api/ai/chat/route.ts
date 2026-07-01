import { NextResponse } from "next/server";
import { answerLocalChat } from "@/lib/chat";
import type { BodyMeasurement, ChatMessage, NutritionLog, ProductStockSummary, SleepLog, Workout } from "@/types/apex";

export const runtime = "nodejs";

type ChatContext = {
  nutrition?: NutritionLog;
  stock: ProductStockSummary[];
  workouts: Workout[];
  body?: BodyMeasurement;
  sleep?: SleepLog;
};

export async function POST(request: Request) {
  const body = (await request.json()) as { message?: string; context?: ChatContext; history?: ChatMessage[] };
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
            "Sos APEX, un asistente personal premium. Responde en espanol rioplatense, breve y accionable. Usa solo el contexto recibido. No inventes datos medicos; para implante/cabello, segui indicaciones medicas como referencia de seguimiento, no reemplazo."
        },
        {
          role: "user",
          content: JSON.stringify({ pregunta: message, historialConversacion: body.history ?? [], contexto: context })
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
