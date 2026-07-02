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
    logChatAi("local_mode", { reason: "missing_api_key", message });
    return NextResponse.json({ answer: fallback, mode: "local" });
  }

  const openAiRequest = {
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
  };
  logChatAi("request", { message, historyCount: body.history?.length ?? 0, request: openAiRequest });

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(openAiRequest)
    });
  } catch (error) {
    logChatAi("error", { message, code: "network_error", error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ answer: fallback, mode: "local", error: "openai_network_error" });
  }

  const rawText = await response.text();
  logChatAi("raw_response", { message, status: response.status, body: rawText });

  if (!response.ok) {
    logChatAi("error", { message, code: "openai_http_error", status: response.status, body: rawText });
    return NextResponse.json({ answer: fallback, mode: "local", error: "openai_http_error" });
  }

  try {
    const data = JSON.parse(rawText) as OpenAiResponse;
    const answer = extractOpenAiText(data)?.trim();
    if (!answer) {
      logChatAi("error", { message, code: "empty_output" });
      return NextResponse.json({ answer: fallback, mode: "local", error: "empty_output" });
    }
    logChatAi("parsed_answer", { message, answer });
    return NextResponse.json({ answer, mode: "openai" });
  } catch (error) {
    logChatAi("error", { message, code: "parse_error", error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ answer: fallback, mode: "local", error: "parse_error" });
  }
}

type OpenAiResponse = {
  output_text?: string;
  output?: { content?: { text?: string }[] }[];
};

function extractOpenAiText(data: OpenAiResponse) {
  return data.output_text ?? data.output?.flatMap((item) => item.content ?? []).find((content) => typeof content.text === "string")?.text;
}

function logChatAi(event: string, payload: Record<string, unknown>) {
  console.info(`[chat-openai:${event}]`, JSON.stringify(sanitizeForLog(payload)));
}

function sanitizeForLog(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/sk-[A-Za-z0-9_-]+/g, "sk-***").slice(0, 4000);
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitizeForLog(entry)]));
  return value;
}
