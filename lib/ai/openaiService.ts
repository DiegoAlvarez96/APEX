export type OpenAiResponsePayload = {
  output_text?: string;
  output?: { content?: { text?: string }[] }[];
};

export type OpenAiRequestPayload = {
  model?: string;
  input: unknown[];
  text?: unknown;
};

export class OpenAiServiceError extends Error {
  code: "missing_api_key" | "quota" | "api_error" | "parse_error" | "empty_output";
  status?: number;
  rawText?: string;

  constructor(code: OpenAiServiceError["code"], message: string, options?: { status?: number; rawText?: string }) {
    super(message);
    this.name = "OpenAiServiceError";
    this.code = code;
    this.status = options?.status;
    this.rawText = options?.rawText;
  }
}

export async function requestOpenAiText({
  request,
  logPrefix,
  logPayload = {}
}: {
  request: OpenAiRequestPayload;
  logPrefix: string;
  logPayload?: Record<string, unknown>;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logOpenAi(logPrefix, "error", { ...logPayload, code: "missing_api_key" });
    throw new OpenAiServiceError("missing_api_key", "Missing OPENAI_API_KEY");
  }

  const openAiRequest = { model: request.model ?? "gpt-4.1-mini", ...request };
  logOpenAi(logPrefix, "request", { ...logPayload, request: openAiRequest });

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(openAiRequest)
    });
  } catch (error) {
    logOpenAi(logPrefix, "error", { ...logPayload, code: "api_error", message: error instanceof Error ? error.message : String(error) });
    throw new OpenAiServiceError("api_error", "OpenAI request failed");
  }

  const rawText = await response.text();
  logOpenAi(logPrefix, "raw_response", { ...logPayload, status: response.status, body: rawText });

  if (!response.ok) {
    const code = detectOpenAiErrorCode(rawText);
    logOpenAi(logPrefix, "error", { ...logPayload, status: response.status, code });
    throw new OpenAiServiceError(code, "OpenAI returned an error", { status: response.status, rawText });
  }

  try {
    const data = JSON.parse(rawText) as OpenAiResponsePayload;
    const text = extractOpenAiText(data)?.trim();
    if (!text) {
      logOpenAi(logPrefix, "error", { ...logPayload, code: "empty_output" });
      throw new OpenAiServiceError("empty_output", "OpenAI response text is empty", { rawText });
    }
    logOpenAi(logPrefix, "parsed_text", { ...logPayload, text });
    return { text, rawText, data };
  } catch (error) {
    if (error instanceof OpenAiServiceError) throw error;
    logOpenAi(logPrefix, "error", { ...logPayload, code: "parse_error", message: error instanceof Error ? error.message : String(error) });
    throw new OpenAiServiceError("parse_error", "Could not parse OpenAI response", { rawText });
  }
}

export function extractOpenAiText(data: OpenAiResponsePayload) {
  return data.output_text ?? data.output?.flatMap((item) => item.content ?? []).find((content) => typeof content.text === "string")?.text;
}

export function parseJsonFromOpenAi<T>(text: string): T {
  return JSON.parse(stripJsonFence(text)) as T;
}

export function stripJsonFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
}

export function detectOpenAiErrorCode(rawText: string): "quota" | "api_error" {
  try {
    const parsed = JSON.parse(rawText) as { error?: { code?: string; type?: string; message?: string } };
    const haystack = `${parsed.error?.code ?? ""} ${parsed.error?.type ?? ""} ${parsed.error?.message ?? ""}`.toLowerCase();
    if (/quota|billing|credit|insufficient/.test(haystack)) return "quota";
  } catch {
    if (/quota|billing|credit|insufficient/i.test(rawText)) return "quota";
  }
  return "api_error";
}

export function logOpenAi(prefix: string, event: string, payload: Record<string, unknown>) {
  console.info(`[${prefix}:${event}]`, JSON.stringify(sanitizeForLog(payload)));
}

function sanitizeForLog(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/sk-[A-Za-z0-9_-]+/g, "sk-***").slice(0, 4000);
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitizeForLog(entry)]));
  return value;
}
