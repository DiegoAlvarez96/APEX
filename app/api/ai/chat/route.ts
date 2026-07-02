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
            "Sos APEX Chat, un asistente tipo ChatGPT conectado a una app personal. Podes responder consultas generales de programacion, viajes, trabajo, ideas, salud general y cualquier tema. Cuando el usuario pregunte por su vida, rutinas, nutricion, stock, fisico, compras o habitos, usa el contexto APEX recibido. No inventes datos personales que no esten en el contexto. Para salud, da informacion general y recomienda profesional cuando corresponda."
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
