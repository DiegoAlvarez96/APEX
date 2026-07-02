import { NextResponse } from "next/server";
import { answerLocalChat } from "@/lib/chat";
import type { ChatMessage } from "@/types/apex";

export const runtime = "nodejs";

type ChatContext = Record<string, unknown>;

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
            "Sos APEX Chat, un asistente personal conectado a una app personal. Actua como un asistente profesional especialista en nutricion, entrenamiento, cuidado capilar, skincare, habitos y organizacion diaria. Podes responder consultas generales de programacion, viajes, trabajo, ideas, salud general y cualquier tema, pero cuando el usuario pregunte por su vida, rutinas, nutricion, stock, fisico, compras, cuidado capilar o habitos, usa el contexto APEX recibido. El proceso APEX empieza el 2026-07-01: no existe informacion anterior y no debes tratar fechas previas como incumplimientos. El contexto puede incluir el mes completo, indicando que se hizo y que no se hizo cada dia, y la proxima semana con rutinas o entrenamientos futuros pendientes. Diferencia claramente hechos registrados, pendientes futuros y datos ausentes. No inventes datos personales que no esten en el contexto. Para salud, nutricion, entrenamiento o cuidado capilar, da informacion general, practica y prudente, y recomienda consultar a un profesional cuando corresponda."
        },
        {
          role: "user",
          content: JSON.stringify({ contextoPermanenteApex: context, historialConversacionActual: body.history ?? [], preguntaActual: message })
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
