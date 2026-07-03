import { NextResponse } from "next/server";
import { getOpenAiApiKeyDiagnostics } from "@/lib/ai/openaiService";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET() {
  const diagnostics = getOpenAiApiKeyDiagnostics(process.env.OPENAI_API_KEY);
  return NextResponse.json({
    ok: true,
    openaiConfigured: diagnostics.configured,
    openaiKey: diagnostics,
    runtime,
    checkedAt: new Date().toISOString()
  });
}
